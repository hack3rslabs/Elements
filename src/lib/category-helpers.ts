import { CATEGORIES, Category } from "@/constants/categories";

/**
 * Find a top-level category by its slug.
 */
export function findCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Find a subcategory within a parent category by slug.
 */
export function findSubCategoryBySlug(
  parent: Category,
  subSlug: string
): Category | undefined {
  return parent.subCategories?.find((sc) => sc.slug === subSlug);
}

/**
 * Check if a category is a leaf node (no further subcategories).
 */
export function isLeafCategory(category: Category): boolean {
  return !category.subCategories || category.subCategories.length === 0;
}
