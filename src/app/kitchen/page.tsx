"use client";

import { Header } from "@/components/layout/header";
import { ProductCard, Product } from "@/components/product/product-card";
import { useEffect, useState } from "react";

export default function KitchenPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch("/api/products?category=kitchen&limit=50")
            .then(r => r.json())
            .then(d => {
                if (d?.success) {
                    const mapped: Product[] = (d.data || []).map((p: any) => ({
                        id: String(p.id),
                        name: String(p.name),
                        slug: String(p.slug),
                        category: String(p.categoryName || "Kitchen"),
                        price: Number(p.price) || 0,
                        originalPrice: p.mrp ? Number(p.mrp) : undefined,
                        image: String(p.image || (Array.isArray(p.images) ? p.images[0] : "") || "/images/products/kicjen sunk 1.webp"),
                        rating: typeof p.rating === "number" ? p.rating : undefined,
                        reviews: typeof p.reviewCount === "number" ? p.reviewCount : undefined,
                    }));
                    setProducts(mapped);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-background">
                <div className="container py-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Kitchen Collection</h1>
                            <p className="text-muted-foreground mt-1">Premium sinks and accessories for your modern kitchen.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Placeholders for filters */}
                            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option>Sort by: Featured</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading products...</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <footer className="border-t bg-background py-8 mt-auto">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2026 Hindustan Elements. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

