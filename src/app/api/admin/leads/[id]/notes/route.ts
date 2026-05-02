import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

interface Note {
  id: string;
  text: string;
  type: string;
  createdBy: string;
  createdAt: string;
}

const isAdmin = (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  return apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026';
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const { text, type = 'note', createdBy = 'Admin' } = await request.json();
    const lead = await prisma.cRMLead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });

    const newNote: Note = {
      id: uuidv4(),
      text,
      type,
      createdBy,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...(lead.notes as unknown as Note[]), newNote];

    const updated = await prisma.cRMLead.update({
      where: { id },
      data: { notes: updatedNotes as unknown as object[] }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('[API] Note Create Error:', error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
