import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }
    const { name, email, phone, message, type = 'general' } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    // Create a new lead in the CRMLead table
    const lead = await prisma.cRMLead.create({
      data: {
        name,
        email,
        phone: phone || '',
        source: 'WEBSITE_CONTACT',
        type: type || 'general',
        status: 'NEW',
        notes: message ? [
          {
            id: `msg_${Date.now()}`,
            text: message,
            type: 'note',
            createdBy: 'Contact Form',
            createdAt: new Date().toISOString(),
          }
        ] : [],
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you! Your message has been received.', 
      data: { id: lead.id } 
    }, { status: 201 });

  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string; toString: () => string };
    console.error('[API] Contact Route Error:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'Internal Server Error',
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      prismaInitialized: !!prisma,
      modelAvailable: !!prisma?.cRMLead
    }, { status: 500 });
  }
}
