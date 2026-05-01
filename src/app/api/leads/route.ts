import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  try {
    const { name, email, phone, source = 'website' } = await request.json();
    if (!name && !email && !phone) return NextResponse.json({ success: false, message: 'At least one contact field is required' }, { status: 400 });

    const lead = await prisma.cRMLead.create({
      data: {
        name: name || 'Unknown',
        email: email || '',
        phone: phone || '',
        source: source.toUpperCase(),
        status: 'NEW'
      }
    });
    return NextResponse.json({ success: true, message: 'Lead captured', data: lead }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API] Leads Error:', error);
    return NextResponse.json({ success: false, message: 'Lead capture failed', error: (error as Error).message }, { status: 500 });
  }
}


