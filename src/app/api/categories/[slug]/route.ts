import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  if (!prisma) {
    return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            reviews: true
          }
        },
        children: true,
        parent: true
      }
    });

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('[API] Category Detail Fetch Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fetching category', 
      error: error.message 
    }, { status: 500 });
  }
}
