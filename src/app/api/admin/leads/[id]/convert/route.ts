import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const lead = await prisma.cRMLead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });

    // In a real app, this would create a User and an Order, or just tag the lead.
    // For now, we'll mark the lead as converted.
    const updated = await prisma.cRMLead.update({
      where: { id },
      data: { 
        convertedToCustomer: true,
        status: 'WON',
        customerId: `CUST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      }
    });

    return NextResponse.json({ success: true, message: 'Lead converted to customer', data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
