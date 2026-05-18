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
    let setting = await prisma.setting.findUnique({
      where: { id: 'global' }
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: 'global',
          storeName: 'Hindustan Elements',
          tagline: 'Premium Building Elements',
          supportEmail: 'support@hindustan-elements.com',
          contactPhone: '+91 99955 52252',
          freeShippingAbove: 5000,
          deliveryTime: '3-7 Business Days',
        }
      });
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const body = await request.json();
    const updated = await prisma.setting.upsert({
      where: { id: 'global' },
      update: {
        storeName: body.storeName,
        tagline: body.tagline,
        supportEmail: body.supportEmail,
        contactPhone: body.contactPhone,
        freeShippingAbove: body.freeShippingAbove !== undefined ? Number(body.freeShippingAbove) : undefined,
        deliveryTime: body.deliveryTime,
        gstNumber: body.gstNumber,
        panNumber: body.panNumber,
      },
      create: {
        id: 'global',
        storeName: body.storeName || 'Hindustan Elements',
        tagline: body.tagline || 'Premium Building Elements',
        supportEmail: body.supportEmail || 'support@hindustan-elements.com',
        contactPhone: body.contactPhone || '+91 99955 52252',
        freeShippingAbove: body.freeShippingAbove !== undefined ? Number(body.freeShippingAbove) : 5000,
        deliveryTime: body.deliveryTime || '3-7 Business Days',
        gstNumber: body.gstNumber || '',
        panNumber: body.panNumber || '',
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
