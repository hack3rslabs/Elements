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

    const formattedCategories = categories.map(cat => ({
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

    return NextResponse.json({ success: true, data: formattedCategories });
  } catch (error: unknown) {
    console.error('[API] Categories Fetch Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch categories', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}


