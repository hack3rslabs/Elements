import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toProductDTO, BaseProduct } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q');
  
  if (!q || !prisma) {
    return NextResponse.json({ 
      success: true, 
      data: { products: [] } 
    });
  }

  try {
    // Search products by name, description, or SKU
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { metaKeywords: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 8, // Take a few more than the 5 displayed to allow for variety if needed
      include: { 
        category: {
          include: { parent: true }
        }, 
        reviews: true 
      }
    });

    // Also search categories to potentially show them in the future
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 3
    });

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((p: unknown) => toProductDTO(p as BaseProduct)),
        categories: categories.map(c => ({ name: c.name, slug: c.slug }))
      }
    });
  } catch (error) {
    console.error('[API] Search Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Search failed', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
