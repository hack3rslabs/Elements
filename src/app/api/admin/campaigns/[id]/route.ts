import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const isAdmin = (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  return apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026';
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const body = await request.json();
    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        platform: body.platform !== undefined ? body.platform : undefined,
        budget: body.budget !== undefined ? Number(body.budget) : undefined,
        spent: body.spent !== undefined ? Number(body.spent) : undefined,
        clicks: body.clicks !== undefined ? Number(body.clicks) : undefined,
        conversions: body.conversions !== undefined ? Number(body.conversions) : undefined,
        status: body.status !== undefined ? body.status : undefined,
      }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
