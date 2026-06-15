import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import CategoryClient from "@/components/categories/CategoryClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Suspense } from "react";
import { generatePageMetadata, generateBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { ensureCategoryHierarchy, getCategoryAndDescendantIds, toProductDTO, computeFacets } from "@/lib/api/helpers";

// Always fetch fresh data - no caching
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

async function getCategoryData(slug: string) {
    if (!prisma) return null;

    try {
        let category = await prisma.category.findUnique({
            where: { slug: slug },
            include: { children: true, parent: true }
        });

        if (!category) {
            const categoryId = await ensureCategoryHierarchy({ categoryName: slug });
            if (categoryId) {
                category = await prisma.category.findUnique({
                    where: { id: categoryId },
                    include: { children: true, parent: true }
                });
            }
        }

        // Final fallback: Look up by ID directly
        if (!category && slug.length > 10) {
            category = await prisma.category.findUnique({
                where: { id: slug },
                include: { children: true, parent: true }
            });
        }

        if (!category) return null;

        const categoryIds = await getCategoryAndDescendantIds(category.id);

        // Fetch all initial products for this category and every nested child category.
        const products = await prisma.product.findMany({
            where: { categoryId: { in: categoryIds } },
            include: { category: { include: { parent: true } }, reviews: true },
            orderBy: { createdAt: 'desc' },
        });

        const productDTOs = products.map(toProductDTO);
        const facets = computeFacets(productDTOs);

        return {
            category,
            products: productDTOs,
            facets
        };
    } catch (e) {
        console.error("Error fetching category:", e);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getCategoryData(slug);

    if (!data) return { title: "Category Not Found" };

    return generatePageMetadata({
        title: data.category.name,
        description: data.category.description || `Explore our range of ${data.category.name} at Elements.`,
        image: data.category.image || undefined,
        url: `/category/${slug}`,
    });
}



export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const data = await getCategoryData(slug);

    if (!data) {
        notFound();
    }

    const breadcrumbLd = generateBreadcrumbSchema([
        { name: "Home", item: "/" },
        { name: data.category.name, item: `/category/${data.category.slug}` }
    ]);

    return (
        <div className="flex min-h-screen flex-col">
            <JsonLd data={breadcrumbLd} />
            <Header />
            <Suspense fallback={<div className="p-8">Loading...</div>}>
                <CategoryClient 
                    initialCategory={{
                        id: data.category.id,
                        name: data.category.name,
                        slug: data.category.slug,
                        description: data.category.description || undefined,
                        image: data.category.image || undefined,
                        children: data.category.children.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
                    }}
                    initialProducts={data.products}
                    initialFacets={data.facets}
                    slug={slug}
                />
            </Suspense>
            <Footer />
        </div>
    );
}
