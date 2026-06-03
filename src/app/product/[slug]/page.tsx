import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { toProductDTO, toReviewDTO } from "@/lib/api/helpers";
import ProductClient from "@/components/products/ProductClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { generatePageMetadata, generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

// ISR: Revalidate every 24 hours (86400 seconds)
// Pre-renders product pages to eliminate on-demand function calls
export const revalidate = 86400;

// Allow rendering pages that weren't pre-rendered at build time
export const dynamicParams = true;

interface Props {
    params: Promise<{ slug: string }>;
}

async function getProductData(slug: string) {
    if (!prisma) return null;

    try {
        // Try finding by slug first
        let product = await prisma.product.findUnique({
            where: { slug: slug },
            include: {
                category: { include: { parent: true } },
                reviews: {
                    include: { user: { select: { name: true, image: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Fallback: Check if the slug is actually an ID (useful for stale links)
        if (!product && slug.length > 10) { 
            product = await prisma.product.findUnique({
                where: { id: slug },
                include: {
                    category: { include: { parent: true } },
                    reviews: {
                        include: { user: { select: { name: true, image: true } } },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        }

        if (!product) return null;

        const formatted = toProductDTO(product);
        const reviews = Array.isArray(product.reviews) ? product.reviews.map(toReviewDTO) : [];
        const related = await prisma.product.findMany({
            where: { categoryId: product.categoryId, NOT: { id: product.id } },
            take: 4,
            include: { category: { include: { parent: true } }, reviews: true },
            orderBy: { createdAt: 'desc' },
        });
        const relatedProducts = related.map(toProductDTO);

        return { ...formatted, reviews, relatedProducts };
    } catch (e) {
        console.error("Error fetching product:", e);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductData(slug);

    if (!product) return { title: "Product Not Found" };

    return generatePageMetadata({
        title: product.metaTitle || product.name,
        description: product.metaDescription || product.shortDescription,
        image: product.images?.[0],
        url: `/product/${slug}`,
        type: "website",
    });
}



export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    const product = await getProductData(slug);

    if (!product) {
        notFound();
    }

    const jsonLd = generateProductSchema(product);
    const breadcrumbLd = generateBreadcrumbSchema([
        { name: "Home", item: "/" },
        { name: product.parentCategory, item: `/category/${product.parentCategory?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}` },
        { name: product.name, item: `/product/${product.slug}` }
    ]);

    return (
        <div className="flex min-h-screen flex-col">
            <JsonLd data={jsonLd} />
            <JsonLd data={breadcrumbLd} />
            <Header />
            <ProductClient product={product} />
            <Footer />
        </div>
    );
}
