import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const isAdmin = (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  return apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026';
};

export async function GET() {
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { status: 'active' },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ success: true, data: slides });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const body = await request.json();
    const slide = await prisma.heroSlide.create({
      data: {
        title: body.title,
        subtitle: body.subtitle,
        description: body.description,
        image: body.image,
        contextImage: body.contextImage || '',
        cta: body.cta || 'Shop Now',
        ctaLink: body.ctaLink || '/products',
        color: body.color || '#1877F2',
        highlight: body.highlight || '',
        priceRange: body.priceRange || '',
        status: body.status || 'active',
        order: body.order || 0,
      }
    });
    return NextResponse.json({ success: true, data: slide });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
