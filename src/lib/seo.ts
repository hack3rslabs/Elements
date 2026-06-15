import { Metadata } from "next";

interface SeoProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: "website" | "article";
}

export function generatePageMetadata({
    title,
    description,
    keywords,
    image,
    url,
    type = "website",
}: SeoProps): Metadata {
    const siteName = "Hindustan Elements";
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = "Premium home décor and construction materials at Elements by Hindustan.";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hindustanelements.com";
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;

    return {
        title: fullTitle,
        description: description || defaultDescription,
        keywords: keywords || "kitchen sinks, elevation panels, home decor, construction materials",
        alternates: {
            canonical: fullUrl,
        },
        openGraph: {
            title: fullTitle,
            description: description || defaultDescription,
            url: fullUrl,
            siteName: siteName,
            images: image ? [{ url: image }] : [],
            type: type,
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description: description || defaultDescription,
            images: image ? [image] : [],
        },
    };
}

interface ProductData {
    name: string;
    images?: string[];
    description?: string;
    shortDescription?: string;
    sku: string;
    slug: string;
    price: number;
    stockStatus: string;
    rating: number;
    reviewCount?: number;
}

export function generateProductSchema(product: ProductData) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hindustanelements.com";
    
    return {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.images || [],
        "description": product.description || product.shortDescription,
        "sku": product.sku,
        "mpn": product.sku,
        "brand": {
            "@type": "Brand",
            "name": "Elements"
        },
        "offers": {
            "@type": "Offer",
            "url": `${baseUrl}/product/${product.slug}`,
            "priceCurrency": "INR",
            "price": product.price,
            "availability": product.stockStatus === "IN_STOCK" 
                ? "https://schema.org/InStock" 
                : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        },
        ...(product.rating > 0 ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviewCount || 1
            }
        } : {})
    };
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hindustanelements.com";
    
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.item.startsWith('http') ? item.item : `${baseUrl}${item.item}`
        }))
    };
}
