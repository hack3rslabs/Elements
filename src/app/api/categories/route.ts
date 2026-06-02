import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (!prisma) {
    return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        },
        parent: true,
        children: true
      }
    });

    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parentId: cat.parentId,
      productCount: cat._count.products,
      parent: cat.parent,
      children: cat.children
    }));

    const response = NextResponse.json({ success: true, data: formattedCategories });
    // Cache for 1 hour on Netlify CDN and browser (static data)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    return response;
  } catch (error: unknown) {
    console.error('[API] Categories Fetch Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch categories', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}


