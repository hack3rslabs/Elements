import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { toProductDTO, toReviewDTO } from "@/lib/api/helpers";
import ProductClient from "@/components/products/ProductClient";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { generatePageMetadata, generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

// Always fetch fresh data - no caching
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

async function getProductData(slug: string) {
    if (!prisma) return null;

    const productInclude = {
        category: { include: { parent: true } },
        reviews: {
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' as const }
        }
    };

    try {
        // 1. Exact slug match
        let product = await prisma.product.findUnique({
            where: { slug },
            include: productInclude,
        });

        // 2. Fallback: slug is actually an ID (useful for stale links)
        if (!product && slug.length > 10) {
            product = await prisma.product.findUnique({
                where: { id: slug },
                include: productInclude,
            });
        }

        // 3. Fallback: case-insensitive partial slug match (handles special chars / encoding issues)
        if (!product) {
            product = await prisma.product.findFirst({
                where: { slug: { contains: slug, mode: 'insensitive' } },
                include: productInclude,
                orderBy: { createdAt: 'desc' },
            });
        }

        // 4. Fallback: match by product name slugified (handles renamed products)
        if (!product) {
            const allProducts = await prisma.product.findMany({
                select: { id: true, slug: true, name: true },
            });
            const decodedSlug = decodeURIComponent(slug).toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const match = allProducts.find(p => {
                const pSlug = (p.slug || '').toLowerCase();
                const pNameSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return pSlug === decodedSlug || pNameSlug === decodedSlug ||
                    pSlug.includes(decodedSlug) || decodedSlug.includes(pSlug);
            });
            if (match) {
                product = await prisma.product.findUnique({
                    where: { id: match.id },
                    include: productInclude,
                });
            }
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

    // If the product was found via a fallback (stale/wrong slug), redirect to canonical URL
    if (product.slug && product.slug !== slug) {
        redirect(`/product/${product.slug}`);
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
