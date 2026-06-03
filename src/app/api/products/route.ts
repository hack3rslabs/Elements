import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { 
  toProductDTO, 
  computeFacets, 
  safeNumber, 
  toStringArray, 
  parseBooleanFlag,
  resolveCategoryId,
  generateUniqueSlug,
  getCategoryAndDescendantIds,
  ensureCategoryHierarchy
} from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const stockStatus = searchParams.get('stockStatus');
  const sort = searchParams.get('sort') || 'featured';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';
  const bestSeller = searchParams.get('bestSeller');
  const newArrival = searchParams.get('newArrival');
  const minRating = searchParams.get('minRating');
  const materials = toStringArray(searchParams.getAll('material'));
  const finishes = toStringArray(searchParams.getAll('finish'));

  const where: Record<string, unknown> = {};

  if (category) {
    let categoryRecord = await prisma.category.findUnique({
      where: { slug: String(category) },
      select: { id: true },
    });

    if (!categoryRecord) {
      const categoryId = await ensureCategoryHierarchy({ categoryName: String(category) });
      categoryRecord = categoryId ? { id: categoryId } : null;
    }

    if (categoryRecord) {
      where.categoryId = { in: await getCategoryAndDescendantIds(categoryRecord.id) };
    } else {
      where.category = { slug: String(category) };
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { sku: { contains: String(search), mode: 'insensitive' } }
    ];
  }

  if (minPrice || maxPrice) {
    const priceWhere: Record<string, number> = {};
    if (minPrice) priceWhere.gte = Number(minPrice);
    if (maxPrice) priceWhere.lte = Number(maxPrice);
    where.price = priceWhere;
  }

  if (stockStatus) {
    where.stockStatus = stockStatus;
  }

  try {
    const items = await prisma.product.findMany({
      where,
      include: { category: { include: { parent: true } }, reviews: true },
      orderBy: { createdAt: 'desc' },
    });

    let formatted = items.map(toProductDTO);

    // Additional filters (computed fields/specs)
    if (materials.length > 0) {
      formatted = formatted.filter(p => p.specifications?.material && materials.includes(p.specifications.material));
    }
    if (finishes.length > 0) {
      formatted = formatted.filter(p => p.specifications?.finish && finishes.includes(p.specifications.finish));
    }
    if (minRating) {
      const r = safeNumber(minRating, 0);
      if (r > 0) formatted = formatted.filter(p => p.rating >= r);
    }
    if (parseBooleanFlag(bestSeller)) {
      formatted = formatted.filter(p => p.isBestSeller);
    }
    if (parseBooleanFlag(newArrival)) {
      formatted = formatted.filter(p => p.isNewArrival);
    }

    // Sorting
    if (sort === 'price_asc') formatted.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') formatted.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') formatted.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popularity') formatted.sort((a, b) => b.reviewCount - a.reviewCount);
    else if (sort === 'newest') formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const facets = computeFacets(formatted);

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const isLimitProvided = searchParams.has('limit');
    const total = formatted.length;
    // If a category is requested and the client didn't explicitly provide a limit,
    // return all matching items so category pages show the full set by default.
    let limitNum;
    if (category && !isLimitProvided) {
      // For category pages, default to showing everything
      limitNum = Math.max(1, total);
    } else {
      // Otherwise respect limit, but with a larger cap for category-filtered results
      const maxCap = category ? 1000 : 100;
      limitNum = Math.min(maxCap, Math.max(1, parseInt(String(limit), 10) || 20));
      
      // If category is provided but limit was some invalid value, fallback to total
      if (category && isNaN(parseInt(String(limit), 10))) {
        limitNum = Math.max(1, total);
      }
    }
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const start = (pageNum - 1) * limitNum;
    const paged = formatted.slice(start, start + limitNum);

    const response = NextResponse.json({
      success: true,
      data: paged,
      facets,
      pagination: { total, page: pageNum, limit: limitNum, pages },
    });
    // Cache for 5 minutes on Netlify CDN and browser
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=300');
    return response;

  } catch (error) {
    const err = error as Error;
    console.error('[API] Products Fetch Error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch products', error: err.message }, { status: 500 });
  }
}

// Port POST /api/products (Admin)
export async function POST(request: NextRequest) {
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  // Security: Check for Admin Key
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
    if (!body.name || !body.sku || body.price === undefined || body.mrp === undefined) {
      return NextResponse.json({ success: false, message: 'name, sku, price and mrp are required' }, { status: 400 });
    }

    const price = safeNumber(body.price, NaN);
    const mrp = safeNumber(body.mrp, NaN);
    if (!Number.isFinite(price) || !Number.isFinite(mrp)) {
      return NextResponse.json({ success: false, message: 'price and mrp must be numbers' }, { status: 400 });
    }

    const categoryId = await resolveCategoryId({
      categoryId: body.categoryId,
      categoryName: body.categoryName || body.category,
      category: body.category,
      subCategory: body.subCategory,
      model: body.model,
    });

    const slug = await generateUniqueSlug(body.slug || body.name);
    const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];

    let tags: string[] = [];
    if (Array.isArray(body.tags)) {
      tags = (body.tags as unknown[]).map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof body.tags === 'string' && body.tags.trim()) {
      tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const metaKeywords = body.metaKeywords || (tags.length > 0 ? tags.join(', ') : undefined);

    const created = await prisma.product.create({
      data: {
        name: String(body.name),
        sku: String(body.sku),
        slug,
        shortDescription: body.shortDescription ? String(body.shortDescription) : undefined,
        description: body.description ? String(body.description) : undefined,
        price,
        mrp,
        stockStatus: body.stockStatus ? (body.stockStatus as "IN_STOCK" | "OUT_OF_STOCK" | "MADE_TO_ORDER") : undefined,
        stock: body.stock !== undefined ? safeNumber(body.stock) : undefined,
        images,
        specifications: body.specifications && typeof body.specifications === 'object' ? body.specifications : undefined,
        variants: body.variants && Array.isArray(body.variants) ? body.variants : undefined,
        metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
        metaDescription: body.metaDescription ? String(body.metaDescription) : undefined,
        metaKeywords: metaKeywords ? String(metaKeywords) : undefined,
        categoryId,
      }
    });

    const full = await prisma.product.findUnique({
      where: { id: created.id },
      include: { category: { include: { parent: true } }, reviews: true },
    });

    // Targeted revalidation
    revalidatePath('/', 'page');
    if (full?.category?.slug) revalidatePath(`/category/${full.category.slug}`, 'page');
    revalidateTag('category-descendants', 'default');

    return NextResponse.json({ success: true, message: 'Product created', data: full ? toProductDTO(full) : toProductDTO(created) }, { status: 201 });
  } catch (error) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string };
    console.error('[API] Product Create Error:', err);
    let message = 'Error creating product';
    if (err.code === 'P2002') message = `A product with that ${err.meta?.target?.join(', ') || 'SKU or slug'} already exists.`;
    return NextResponse.json({ success: false, message, error: err.message }, { status: 500 });
  }
}


