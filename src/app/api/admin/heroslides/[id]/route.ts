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
    const updated = await prisma.heroSlide.update({
      where: { id },
      data: {
        title: body.title,
        subtitle: body.subtitle !== undefined ? body.subtitle : undefined,
        description: body.description !== undefined ? body.description : undefined,
        image: body.image !== undefined ? body.image : undefined,
        contextImage: body.contextImage !== undefined ? body.contextImage : undefined,
        cta: body.cta !== undefined ? body.cta : undefined,
        ctaLink: body.ctaLink !== undefined ? body.ctaLink : undefined,
        color: body.color !== undefined ? body.color : undefined,
        highlight: body.highlight !== undefined ? body.highlight : undefined,
        priceRange: body.priceRange !== undefined ? body.priceRange : undefined,
        status: body.status !== undefined ? body.status : undefined,
        order: body.order !== undefined ? Number(body.order) : undefined,
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
    await prisma.heroSlide.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Slide deleted' });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
