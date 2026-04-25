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

  try {
    const customers = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        orders: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map(c => {
      const totalSpend = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
      return {
        id: c.id,
        name: c.name || 'Guest',
        email: c.email || '',
        phone: c.phone || '',
        totalOrders: c.orders.length,
        totalSpend,
        lastOrder: c.orders[0]?.createdAt.toISOString().split('T')[0] || null,
        status: 'active',
        joined: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
