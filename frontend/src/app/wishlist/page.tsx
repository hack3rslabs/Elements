"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface WishlistProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    images: string[];
    categoryName: string;
    rating: number;
    stockStatus: string;
}

export default function WishlistPage() {
    const { addToCart, toggleWishlist } = useStore();
    const [products, setProducts] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const getSessionId = () => {
        if (typeof window === 'undefined') return 'ssr';
        return localStorage.getItem('elements_session_id') || 'default';
    };

    const fetchWishlist = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/wishlist', {
                headers: { 'x-session-id': getSessionId() }
            });
            const data = await res.json();
            if (data.success) setProducts(data.data);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchWishlist(); }, []);

    const handleRemove = async (productId: string) => {
        await toggleWishlist(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleMoveToCart = async (product: WishlistProduct) => {
        await addToCart(product.id);
        await handleRemove(product.id);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-gray-50">
                <div className="container py-8">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Link href="/" className="hover:text-[#1877F2]">Home</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Wishlist</span>
                    </nav>

                    <h1 className="text-3xl font-bold mb-8">My Wishlist ({products.length})</h1>

                    {!loading && products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
                            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-6">Save items you love by clicking the heart icon on products.</p>
                            <Link href="/">
                                <Button className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full px-8 h-11">
                                    Explore Products
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product) => {
                                const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
                                return (
                                    <div key={product.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="aspect-square relative overflow-hidden bg-gray-100">
                                            <Image src={product.images?.[0] || '/images/products/kicjen sunk 1.webp'} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            {discount > 0 && (
                                                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{discount}% OFF</span>
                                            )}
                                            <button aria-label="Remove from wishlist" onClick={() => handleRemove(product.id)} className="absolute top-3 right-3 h-8 w-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors">
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-xs text-[#1877F2] font-medium uppercase tracking-wider mb-1">{product.categoryName}</p>
                                            <h3 className="font-medium text-sm line-clamp-2 mb-3 min-h-[40px]">
                                                <Link href={`/product/${product.slug}`} className="hover:text-[#1877F2]">{product.name}</Link>
                                            </h3>
                                            <div className="mb-3">
                                                <span className="text-lg font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                                                {product.mrp > product.price && (
                                                    <span className="text-xs text-muted-foreground line-through ml-1.5">₹{product.mrp.toLocaleString("en-IN")}</span>
                                                )}
                                            </div>
                                            <Button onClick={() => handleMoveToCart(product)} className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-9 text-sm font-medium" disabled={product.stockStatus === "OUT_OF_STOCK"}>
                                                <ShoppingCart className="h-4 w-4 mr-2" /> Move to Cart
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
