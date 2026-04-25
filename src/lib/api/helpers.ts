import { prisma } from "@/lib/prisma";

export const DEFAULT_PRODUCT_IMAGE = '/images/products/kicjen sunk 1.webp';
export const NEW_ARRIVAL_DAYS = 90;

export function safeNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function parseBooleanFlag(value: unknown): boolean {
    return value === true || value === 'true' || value === '1' || value === 1;
}

export function toStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean);
    return [String(value)].filter(Boolean);
}

export function slugify(value: string): string {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

export async function generateUniqueSlug(name: string, existingProductId: string | null = null): Promise<string> {
    if (!prisma) return slugify(name);
    const base = slugify(name) || 'product';
    let slug = base;
    let counter = 1;
    while (true) {
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (!existing || (existingProductId && existing.id === existingProductId)) return slug;
        counter += 1;
        slug = `${base}-${counter}`;
    }
}

export async function generateUniqueCategorySlug(name: string): Promise<string> {
    if (!prisma) return slugify(name);
    const base = slugify(name) || 'category';
    let slug = base;
    let counter = 1;
    while (true) {
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (!existing) return slug;
        counter += 1;
        slug = `${base}-${counter}`;
    }
}

export async function resolveCategoryId({ categoryId, categoryName }: { categoryId?: string; categoryName?: string }): Promise<string> {
    if (!prisma) throw new Error("Database not initialized");
    
    if (categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: String(categoryId) } });
        if (!cat) throw new Error('Category not found');
        return cat.id;
    }

    if (categoryName) {
        const name = String(categoryName).trim();
        const slug = slugify(name);
        const exact = await prisma.category.findFirst({
            where: { OR: [{ name }, { slug }] },
            orderBy: { createdAt: 'asc' }
        });
        if (exact) return exact.id;

        const partial = await prisma.category.findMany({
            select: { id: true, name: true, slug: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const match = partial.find((cat) => {
            const catName = String(cat.name || '').toLowerCase();
            const catSlug = String(cat.slug || '').toLowerCase();
            const inputName = name.toLowerCase();
            const inputSlug = slug.toLowerCase();
            return (
                catName.includes(inputName) ||
                inputName.includes(catName) ||
                catSlug.includes(inputSlug) ||
                inputSlug.includes(catSlug)
            );
        });
        if (match) return match.id;

        const created = await prisma.category.create({
            data: {
                name,
                slug: await generateUniqueCategorySlug(name),
            }
        });
        return created.id;
    }

    const fallback = await prisma.category.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!fallback) throw new Error('No categories available');
    return fallback.id;
}

export function normalizeSpecifications(specifications: any): Record<string, string> {
    if (!specifications || typeof specifications !== 'object' || Array.isArray(specifications)) return {};
    const out: Record<string, string> = {};
    for (const [key, val] of Object.entries(specifications)) {
        if (val === null || val === undefined) continue;
        out[key] = typeof val === 'string' ? val : String(val);
    }
    return out;
}

export function parseTagsFromKeywords(metaKeywords: string | null): string[] {
    if (!metaKeywords) return [];
    return String(metaKeywords)
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
}

export function computeRatingStats(reviews: any[]): { rating: number; reviewCount: number } {
    if (!Array.isArray(reviews) || reviews.length === 0) return { rating: 0, reviewCount: 0 };
    const reviewCount = reviews.length;
    const total = reviews.reduce((sum, r) => sum + safeNumber(r.rating, 0), 0);
    const avg = total / reviewCount;
    return { rating: Number(avg.toFixed(1)), reviewCount };
}

export function isNewArrival(createdAt: Date | string | null): boolean {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return false;
    return Date.now() - d.getTime() <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

export function toProductDTO(product: any) {
    const images = Array.isArray(product.images) ? (product.images as string[]).filter(Boolean) : [];
    const image = images[0] || DEFAULT_PRODUCT_IMAGE;
    const categoryName = product.category?.name || '';
    const parentCategory = product.category?.parent?.name || product.category?.name || '';
    const { rating, reviewCount } = computeRatingStats(product.reviews || []);
    const specs = normalizeSpecifications(product.specifications);
    const tags = parseTagsFromKeywords(product.metaKeywords);
    const derivedTags = tags.length > 0 ? tags : [specs.material, specs.finish, categoryName, parentCategory].filter(Boolean);

    return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        price: safeNumber(product.price),
        mrp: safeNumber(product.mrp),
        stockStatus: product.stockStatus,
        stock: safeNumber(product.stock),
        images,
        image,
        specifications: specs,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        categoryId: product.categoryId,
        categoryName,
        parentCategory,
        rating,
        reviewCount,
        isNewArrival: isNewArrival(product.createdAt),
        isBestSeller: reviewCount >= 2,
        tags: derivedTags,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

export function toReviewDTO(review: any) {
    return {
        id: review.id,
        userName: review.user?.name || 'Anonymous',
        rating: safeNumber(review.rating),
        comment: review.comment || '',
        verified: true,
        createdAt: review.createdAt,
    };
}

export function computeFacets(products: any[]) {
    const materials = new Set<string>();
    const finishes = new Set<string>();
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    let inStock = 0;
    let bestSellers = 0;
    let newArrivals = 0;

    for (const p of products) {
        const material = p.specifications?.material;
        const finish = p.specifications?.finish;
        if (material) materials.add(material);
        if (finish) finishes.add(finish);
        if (Number.isFinite(p.price)) {
            min = Math.min(min, p.price);
            max = Math.max(max, p.price);
        }
        if (p.stockStatus === 'IN_STOCK') inStock += 1;
        if (p.isBestSeller) bestSellers += 1;
        if (p.isNewArrival) newArrivals += 1;
    }

    return {
        materials: Array.from(materials).sort(),
        finishes: Array.from(finishes).sort(),
        priceRange: { min: min === Number.POSITIVE_INFINITY ? 0 : Math.floor(min), max: Math.ceil(max) },
        counts: { inStock, bestSellers, newArrivals },
    };
}

