import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface LeadNote {
  id: string;
  text: string;
  type: string;
  createdBy: string;
  createdAt: string;
}

// Security check helper
const isAdmin = (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  return apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026';
};

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') where.status = status.toUpperCase();
  if (source && source !== 'all') where.source = source.toUpperCase();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const leads = await prisma.cRMLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Match the frontend's expected "Lead" interface
    const formatted = leads.map(l => {
      const notes = (l.notes as unknown as LeadNote[]) || [];
      return {
        ...l,
        timestamp: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        status: l.status.toLowerCase(),
        source: l.source?.toLowerCase() || 'manual',
        message: notes.length > 0 ? notes[0].text : '',
        notes: notes,
        followUps: (l.followUps as unknown as unknown[]) || [],
        value: Number(l.value || 0),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const body = await request.json();
    const lead = await prisma.cRMLead.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: (body.source || 'manual').toUpperCase(),
        status: 'NEW',
        notes: body.message ? [{ id: 'init', text: body.message, type: 'note', createdBy: 'Admin', createdAt: new Date().toISOString() }] : [],
      }
    });
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
