import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hindustanelements.com';

    // Base routes
    const staticRoutes = [
        '',
        '/about',
        '/contact',
        '/categories',
        '/track-order',
    ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    if (!prisma) return staticRoutes;

    try {
        // Fetch All Categories
        const categories = await prisma.category.findMany({
            select: { slug: true, updatedAt: true }
        });

        const categoryRoutes = categories.map(cat => ({
            url: `${baseUrl}/category/${cat.slug}`,
            lastModified: cat.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        // Fetch All Products
        const products = await prisma.product.findMany({
            select: { slug: true, updatedAt: true }
        });

        const productRoutes = products.map(prod => ({
            url: `${baseUrl}/product/${prod.slug}`,
            lastModified: prod.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.6,
        }));

        return [...staticRoutes, ...categoryRoutes, ...productRoutes];
    } catch (error) {
        console.error('[Sitemap] Error generating sitemap:', error);
        return staticRoutes;
    }
}
