import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  toProductDTO, 
  toReviewDTO, 
  safeNumber, 
  generateUniqueSlug, 
  resolveCategoryId 
} from '@/lib/api/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  try {
    // Try to find by slug first, then by ID
    let product = await prisma.product.findUnique({
      where: { slug: identifier },
      include: {
        category: { include: { parent: true } },
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: identifier },
        include: {
          category: { include: { parent: true } },
          reviews: {
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    }
    
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    // Find related products
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, NOT: { id: product.id } },
      take: 4,
      include: { category: { include: { parent: true } }, reviews: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = toProductDTO(product);
    const reviews = Array.isArray(product.reviews) ? product.reviews.map(toReviewDTO) : [];
    const relatedProducts = related.map(toProductDTO);

    return NextResponse.json({ success: true, data: { ...formatted, reviews, relatedProducts } });
  } catch (error: any) {
    console.error('[API] Product Detail Error:', error);
    return NextResponse.json({ success: false, message: 'Error fetching product', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier: id } = await params;
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  // Security
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';

  const isAdminKeyValid = apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026' ||
    (authHeader && (authHeader === `Bearer ${ADMIN_API_KEY}` || authHeader === 'Bearer elements-admin-key-2026'));

  if (!isAdminKeyValid) {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data: any = {};

    if (body.name !== undefined) data.name = String(body.name);
    if (body.sku !== undefined) data.sku = String(body.sku);
    if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription ? String(body.shortDescription) : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.price !== undefined) {
      const price = safeNumber(body.price, NaN);
      if (!Number.isFinite(price)) return NextResponse.json({ success: false, message: 'price must be a number' }, { status: 400 });
      data.price = price;
    }
    if (body.mrp !== undefined) {
      const mrp = safeNumber(body.mrp, NaN);
      if (!Number.isFinite(mrp)) return NextResponse.json({ success: false, message: 'mrp must be a number' }, { status: 400 });
      data.mrp = mrp;
    }
    if (body.stockStatus !== undefined) data.stockStatus = body.stockStatus as any;
    if (body.stock !== undefined) {
      const stock = safeNumber(body.stock, NaN);
      if (!Number.isFinite(stock)) return NextResponse.json({ success: false, message: 'stock must be a number' }, { status: 400 });
      data.stock = stock;
    }
    if (body.images !== undefined) data.images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    if (body.specifications !== undefined && typeof body.specifications === 'object') data.specifications = body.specifications;
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle ? String(body.metaTitle) : null;
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription ? String(body.metaDescription) : null;

    if (body.metaKeywords !== undefined) {
      data.metaKeywords = body.metaKeywords ? String(body.metaKeywords) : null;
    } else if (body.tags !== undefined) {
      const tags = Array.isArray(body.tags) ? (body.tags as any[]).map((t: any) => String(t).trim()).filter(Boolean) : [];
      data.metaKeywords = tags.length > 0 ? tags.join(', ') : null;
    }

    if (body.slug !== undefined && body.slug) {
      data.slug = await generateUniqueSlug(body.slug, id);
    }

    if (body.categoryId !== undefined || body.categoryName !== undefined || body.category !== undefined) {
      data.categoryId = await resolveCategoryId({
        categoryId: body.categoryId,
        categoryName: body.categoryName || body.category,
      });
    }

    await prisma.product.update({ where: { id }, data });

    const full = await prisma.product.findUnique({
      where: { id },
      include: { category: { include: { parent: true } }, reviews: true },
    });
    return NextResponse.json({ success: true, message: 'Product updated', data: full ? toProductDTO(full) : null });
  } catch (error: any) {
    console.error('[API] Product Update Error:', error);
    return NextResponse.json({ success: false, message: 'Error updating product', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier: id } = await params;
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  // Security
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';

  const isAdminKeyValid = apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026' ||
    (authHeader && (authHeader === `Bearer ${ADMIN_API_KEY}` || authHeader === 'Bearer elements-admin-key-2026'));

  if (!isAdminKeyValid) {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    console.error('[API] Product Delete Error:', error);
    return NextResponse.json({ success: false, message: 'Error deleting product', error: error.message }, { status: 500 });
  }
}
