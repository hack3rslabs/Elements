import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface GSTProduct {
    category?: {
        name?: string;
        slug?: string;
        parent?: {
            name?: string;
            slug?: string;
        } | null;
    } | null;
}

export function getGSTPercentage(product: GSTProduct): number {
    const categorySlug = product.category?.slug || '';
    const parentCategorySlug = product.category?.parent?.slug || '';

    // Check if it's a terracota product (based on slugs from categories.ts)
    if (categorySlug === 'terracota-products' || parentCategorySlug === 'terracota-products') {
        return 12;
    }

    // Check for common variations in names/slugs just in case
    const catName = (product.category?.name || '').toLowerCase();
    const pCatName = (product.category?.parent?.name || '').toLowerCase();

    if (
        catName.includes('terracota') || catName.includes('terracotta') ||
        categorySlug.includes('terracota') || categorySlug.includes('terracotta') ||
        pCatName.includes('terracota') || pCatName.includes('terracotta') ||
        parentCategorySlug.includes('terracota') || parentCategorySlug.includes('terracotta')
    ) {
        return 12;
    }

    return 18;
}

