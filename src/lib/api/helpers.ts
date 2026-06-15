import { prisma } from "@/lib/prisma";
import { CATEGORIES, type Category } from "@/constants/categories";

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

type CategoryHierarchyInput = {
    category?: string;
    subCategory?: string;
    model?: string;
    categoryName?: string;
};

function normalizeCategoryValue(value: unknown): string {
    return String(value || '').trim().toLowerCase();
}

function matchesCategoryNode(node: Category, value: unknown): boolean {
    const raw = normalizeCategoryValue(value);
    if (!raw) return false;
    const inputSlug = slugify(raw);
    return (
        normalizeCategoryValue(node.name) === raw ||
        normalizeCategoryValue(node.slug) === raw ||
        slugify(node.name) === inputSlug ||
        slugify(node.slug) === inputSlug
    );
}

function findCategoryPathByValue(value: unknown, nodes: Category[] = CATEGORIES, path: Category[] = []): Category[] | null {
    for (const node of nodes) {
        const nextPath = [...path, node];
        if (matchesCategoryNode(node, value)) return nextPath;
        const childPath = findCategoryPathByValue(value, node.subCategories || [], nextPath);
        if (childPath) return childPath;
    }
    return null;
}

function collectCategorySlugs(node: Category): string[] {
    return [
        node.slug,
        ...(node.subCategories || []).flatMap((child) => collectCategorySlugs(child)),
    ];
}

function findCategoryPath(input: CategoryHierarchyInput): Category[] | null {
    const top = CATEGORIES.find((node) => matchesCategoryNode(node, input.category));
    const sub = top?.subCategories?.find((node) => matchesCategoryNode(node, input.subCategory));
    const model = sub?.subCategories?.find((node) => matchesCategoryNode(node, input.model));

    if (model && sub && top) return [top, sub, model];
    if (sub && top) return [top, sub];
    if (top) return [top];

    return findCategoryPathByValue(input.model || input.subCategory || input.categoryName || input.category);
}

export async function ensureCategoryHierarchy(input: CategoryHierarchyInput): Promise<string | null> {
    if (!prisma) throw new Error("Database not initialized");

    const path = findCategoryPath(input);
    if (!path) return null;

    let parentId: string | null = null;
    let currentId: string | null = null;

    for (const node of path) {
        let category = await prisma.category.findUnique({ where: { slug: node.slug } });
        if (!category) {
            category = await prisma.category.findFirst({
                where: {
                    name: node.name,
                    OR: [{ parentId }, { parentId: null }],
                },
                orderBy: { createdAt: 'asc' },
            });
        }

        const data: {
            name: string;
            slug: string;
            description: string | null;
            image: string | null;
            parentId: string | null;
        } = {
            name: node.name,
            slug: node.slug,
            description: node.desc || null,
            image: node.image || null,
            parentId,
        };

        if (category) {
            const needsUpdate: boolean =
                category.name !== data.name ||
                category.slug !== data.slug ||
                category.description !== data.description ||
                category.image !== data.image ||
                category.parentId !== data.parentId;

            category = needsUpdate
                ? await prisma.category.update({ where: { id: category.id }, data })
                : category;
        } else {
            category = await prisma.category.create({ data });
        }

        parentId = category.id;
        currentId = category.id;
    }

    return currentId;
}

// Internal implementation - cached version prevents N+1 queries
async function _getDescendantCategoryIdsImpl(categoryId: string): Promise<string[]> {
    if (!prisma) throw new Error("Database not initialized");

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { slug: true },
    });

    const staticPath = category ? findCategoryPathByValue(category.slug) : null;
    const staticNode = staticPath?.[staticPath.length - 1];
    const staticSlugs = staticNode ? collectCategorySlugs(staticNode) : [];
    const staticMatches = staticSlugs.length > 0
        ? await prisma.category.findMany({
            where: { slug: { in: staticSlugs } },
            select: { id: true },
        })
        : [];

    const ids = new Set<string>(staticMatches.map((match) => match.id));
    ids.delete(categoryId);
    let frontier = [categoryId, ...Array.from(ids)];
    const visited = new Set<string>();

    while (frontier.length > 0) {
        const nextFrontier = frontier.filter((id) => !visited.has(id));
        if (nextFrontier.length === 0) break;
        nextFrontier.forEach((id) => visited.add(id));

        const children = await prisma.category.findMany({
            where: { parentId: { in: nextFrontier } },
            select: { id: true },
        });

        frontier = children.map((child) => child.id);
        frontier.forEach((id) => ids.add(id));
    }

    return Array.from(ids);
}

// Direct export without caching
export const getDescendantCategoryIds = _getDescendantCategoryIdsImpl;

export async function getCategoryAndDescendantIds(categoryId: string): Promise<string[]> {
    return [categoryId, ...(await getDescendantCategoryIds(categoryId))];
}

export async function resolveCategoryId({
    categoryId,
    categoryName,
    category,
    subCategory,
    model,
}: {
    categoryId?: string;
    categoryName?: string;
    category?: string;
    subCategory?: string;
    model?: string;
}): Promise<string> {
    if (!prisma) throw new Error("Database not initialized");
    
    if (categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: String(categoryId) } });
        if (!cat) throw new Error('Category not found');
        return cat.id;
    }

    const hierarchicalCategoryId = await ensureCategoryHierarchy({
        category,
        subCategory,
        model,
        categoryName,
    });
    if (hierarchicalCategoryId) return hierarchicalCategoryId;

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

export function normalizeSpecifications(specifications: unknown): Record<string, string> {
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

export function computeRatingStats(reviews: unknown[]): { rating: number; reviewCount: number } {
    if (!Array.isArray(reviews) || reviews.length === 0) return { rating: 0, reviewCount: 0 };
    const reviewCount = reviews.length;
    const total = reviews.reduce((sum: number, r) => sum + safeNumber((r as { rating?: unknown }).rating, 0), 0);
    const avg = total / reviewCount;
    return { rating: Number(avg.toFixed(1)), reviewCount };
}

export function isNewArrival(createdAt: Date | string | null): boolean {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return false;
    return Date.now() - d.getTime() <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

export interface BaseProduct {
    id: string;
    name: string;
    sku: string;
    slug: string;
    shortDescription?: string | null;
    description?: string | null;
    price: unknown;
    mrp: unknown;
    stockStatus: string;
    stock: unknown;
    images: string[];
    specifications?: unknown;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    categoryId: string;
    category?: {
        name: string;
        slug: string;
        parent?: {
            name: string;
            slug: string;
        } | null;
    } | null;
    reviews?: BaseReview[];
    variants?: unknown;
    createdAt: Date | string;
    updatedAt: Date | string;
}

import { getGSTPercentage } from "@/lib/utils";

/**
 * Calculates GST percentage based on product category.
 * 12% for Terracotta products, 18% for others.
 */
// Re-exporting from shared utils
export { getGSTPercentage };

export interface ProductVariant {
    color?: string;
    price?: number | string;
    mrp?: number | string;
    stock?: number | string;
    images?: string[];
}

export function toProductDTO(product: BaseProduct) {
    const categoryName = product.category?.name || '';
    const parentCategory = product.category?.parent?.name || product.category?.name || '';
    const { rating, reviewCount } = computeRatingStats(product.reviews || []);
    const specs = normalizeSpecifications(product.specifications);
    const tags = parseTagsFromKeywords(product.metaKeywords || null);
    const derivedTags = tags.length > 0 ? tags : [specs.material, specs.finish, categoryName, parentCategory].filter(Boolean);

    const variants = (() => {
        const raw = product.variants;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as ProductVariant[];
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed as ProductVariant[];
                if (typeof parsed === 'string') {
                    const doubleParsed = JSON.parse(parsed);
                    if (Array.isArray(doubleParsed)) return doubleParsed as ProductVariant[];
                }
            } catch (e) {
                console.error("Failed to parse variants JSON:", e);
            }
        }
        return [];
    })();

    let images = Array.isArray(product.images) ? (product.images as string[]).filter(Boolean) : [];
    if (images.length === 0 && variants.length > 0) {
        const firstVariantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.filter(Boolean).length > 0);
        if (firstVariantWithImages) {
            images = (firstVariantWithImages.images || []).filter(Boolean);
        } else {
            images = variants.flatMap((v) => Array.isArray(v.images) ? (v.images || []) : []).filter(Boolean);
        }
    }
    const image = images[0] || DEFAULT_PRODUCT_IMAGE;

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
        variants,
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

export interface BaseReview {
    id: string;
    user?: {
        name?: string | null;
    } | null;
    rating: unknown;
    comment?: string | null;
    createdAt: Date | string;
}

export function toReviewDTO(review: BaseReview) {
    return {
        id: review.id,
        userName: review.user?.name || 'Anonymous',
        rating: safeNumber(review.rating),
        comment: review.comment || '',
        verified: true,
        createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
    };
}

export function computeFacets(products: BaseProduct[]) {
    const materials = new Set<string>();
    const finishes = new Set<string>();
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    let inStock = 0;
    let bestSellers = 0;
    let newArrivals = 0;

    for (const p of products) {
        const specs = normalizeSpecifications(p.specifications);
        const material = specs.material;
        const finish = specs.finish;
        if (material) materials.add(material);
        if (finish) finishes.add(finish);
        
        const price = safeNumber(p.price);
        if (Number.isFinite(price)) {
            min = Math.min(min, price);
            max = Math.max(max, price);
        }
        if (p.stockStatus === 'IN_STOCK') inStock += 1;
        
        // Use logic from toProductDTO or similar for derived fields
        const { reviewCount } = computeRatingStats(p.reviews || []);
        if (reviewCount >= 2) bestSellers += 1;
        if (isNewArrival(p.createdAt)) newArrivals += 1;
    }

    return {
        materials: Array.from(materials).sort(),
        finishes: Array.from(finishes).sort(),
        priceRange: { min: min === Number.POSITIVE_INFINITY ? 0 : Math.floor(min), max: Math.ceil(max) },
        counts: { inStock, bestSellers, newArrivals },
    };
}

