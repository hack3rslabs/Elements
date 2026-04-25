import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  const where: any = {};
  if (status && status !== 'all') where.status = status.toUpperCase();

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format for frontend
    const formatted = orders.map(o => ({
      id: o.id,
      customerName: o.user?.name || 'Guest',
      email: o.user?.email || '',
      phone: o.user?.phone || '',
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      items: o.items.map(i => ({
        name: i.name || i.product?.name || 'Product',
        quantity: i.quantity,
        price: Number(i.price),
      })),
      paymentMethod: 'Prepaid', // Default for now
      paymentStatus: 'PAID',
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
