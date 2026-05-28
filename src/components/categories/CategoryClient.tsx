"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Grid3X3, LayoutList, Heart, Filter, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FilterSidebar } from "@/components/products/FilterSidebar";

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    images: string[];
    categoryName: string;
    description?: string;
    shortDescription?: string;
    rating: number;
    reviewCount: number;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    stockStatus: string;
}

interface CategoryData {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    children?: { id: string; name: string; slug: string }[];
}

interface Facets {
    materials: string[];
    finishes: string[];
    priceRange: { min: number; max: number };
    counts: { inStock: number; bestSellers: number; newArrivals: number };
}

interface FilterState {
    sort: string;
    minPrice: string;
    maxPrice: string;
    material: string[];
    finish: string[];
    minRating: string;
    stockStatus: string;
    bestSeller: string;
    newArrival: string;
}

export default function CategoryClient({ 
    initialCategory, 
    initialProducts, 
    initialFacets,
    slug 
}: { 
    initialCategory: CategoryData;
    initialProducts: Product[];
    initialFacets: Facets | null;
    slug: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
    
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [facets, setFacets] = useState<Facets | null>(initialFacets);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    
    const [filters, setFilters] = useState<FilterState>({
        sort: searchParams.get("sort") || "featured",
        minPrice: searchParams.get("minPrice") || "",
        maxPrice: searchParams.get("maxPrice") || "",
        material: searchParams.getAll("material"),
        finish: searchParams.getAll("finish"),
        minRating: searchParams.get("minRating") || "",
        stockStatus: searchParams.get("stockStatus") || "",
        bestSeller: searchParams.get("bestSeller") || "",
        newArrival: searchParams.get("newArrival") || "",
    });

    const updateFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
        const params = new URLSearchParams();
        if (newFilters.sort !== "featured") params.set("sort", newFilters.sort);
        if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
        if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
        if (newFilters.minRating) params.set("minRating", newFilters.minRating);
        if (newFilters.stockStatus) params.set("stockStatus", newFilters.stockStatus);
        if (newFilters.bestSeller) params.set("bestSeller", newFilters.bestSeller);
        if (newFilters.newArrival) params.set("newArrival", newFilters.newArrival);
        
        newFilters.material.forEach((m: string) => params.append("material", m));
        newFilters.finish.forEach((f: string) => params.append("finish", f));
        
        router.push(`/category/${slug}?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        const reset = {
            sort: "featured",
            minPrice: "",
            maxPrice: "",
            material: [],
            finish: [],
            minRating: "",
            stockStatus: "",
            bestSeller: "",
            newArrival: "",
        };
        updateFilters(reset);
    };

    const fetchProducts = useCallback(() => {
        // Skip fetch on initial load if filters match initial state (roughly)
        // But for simplicity, we'll fetch when filters change
        setLoading(true);
        const query = new URLSearchParams();
        query.set("category", slug);
        query.set("sort", filters.sort);
        if (filters.minPrice) query.set("minPrice", filters.minPrice);
        if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);
        if (filters.minRating) query.set("minRating", filters.minRating);
        if (filters.stockStatus) query.set("stockStatus", filters.stockStatus);
        if (filters.bestSeller) query.set("bestSeller", filters.bestSeller);
        if (filters.newArrival) query.set("newArrival", filters.newArrival);
        
        filters.material.forEach(m => query.append("material", m));
        filters.finish.forEach(f => query.append("finish", f));

        fetch(`/api/products?${query.toString()}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setProducts(d.data);
                    setFacets(d.facets);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug, filters]);

    // Only run this when filters actually change after initial mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        if (mounted) {
            fetchProducts();
        } else {
            setMounted(true);
        }
    }, [filters, fetchProducts, mounted]);

    return (
        <main className="flex-1 bg-gray-50 pb-20">
            {/* Category Banner */}
            <section className="relative bg-gradient-to-r from-[#0d47a1] to-[#1877F2] py-5 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/products/k%20s%202.jpg')] bg-cover bg-center opacity-10"></div>
                <div className="container relative z-10 text-white">
                    <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-up">
                        <Link href="/" className="hover:text-white transition-colors hover-underline">Home</Link>
                        <span>/</span>
                        <span className="text-white font-medium">{initialCategory?.name || slug}</span>
                    </nav>
                    <ScrollReveal direction="up">
                        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">{initialCategory?.name || slug}</h1>
                    </ScrollReveal>
                    {initialCategory?.description && (
                        <ScrollReveal direction="up" delay={0.15}>
                            <p className="text-white/80 mt-4 text-sm max-w-sm leading-relaxed">{initialCategory.description}</p>
                        </ScrollReveal>
                    )}
                        <ScrollReveal direction="up" delay={0.25}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mt-8">
                            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-white/90 text-sm font-medium">{products.length} Products Available</span>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <div className="container py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar (Desktop) */}
                    <div className="hidden lg:block">
                        <FilterSidebar 
                            facets={facets} 
                            activeFilters={filters} 
                            onFilterChange={updateFilters}
                            onClearAll={clearFilters}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Toolbar omitted for brevity or kept - let's keep it complete */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-white rounded-2xl shadow-sm border p-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Button 
                                    variant="outline" 
                                    className="lg:hidden rounded-xl border-gray-200 flex items-center gap-2"
                                    onClick={() => setShowMobileFilters(true)}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </Button>
                                
                                <div className="relative">
                                    <select
                                        id="sort-products"
                                        value={filters.sort}
                                        onChange={(e) => updateFilters({ ...filters, sort: e.target.value })}
                                        className="h-11 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm font-medium focus:ring-2 focus:ring-[#1877F2]/20 outline-none appearance-none pr-10 cursor-pointer min-w-[200px]"
                                        aria-label="Sort products"
                                    >
                                        <option value="featured">Featured (Recommended)</option>
                                        <option value="price_asc">Price: Low to High</option>
                                        <option value="price_desc">Price: High to Low</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="newest">Newest Arrivals</option>
                                        <option value="popularity">Most Popular</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <p className="text-sm text-gray-500 mr-4 hidden md:block">
                                    Showing {products.length} results
                                </p>
                                <Button
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    size="icon"
                                    className={`h-11 w-11 rounded-xl transition-all ${viewMode === "grid" ? 'bg-[#1877F2]' : 'hover:bg-gray-100'}`}
                                    onClick={() => setViewMode("grid")}
                                >
                                    <Grid3X3 className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="icon"
                                    className={`h-11 w-11 rounded-xl transition-all ${viewMode === "list" ? 'bg-[#1877F2]' : 'hover:bg-gray-100'}`}
                                    onClick={() => setViewMode("list")}
                                >
                                    <LayoutList className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Results */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border p-4 space-y-4 animate-pulse">
                                        <div className="aspect-square bg-gray-100 rounded-xl" />
                                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                                        <div className="h-4 bg-gray-100 rounded w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No items match your filters</h3>
                                <Button onClick={clearFilters} className="rounded-full bg-[#1877F2] mt-4">Reset All Filters</Button>
                            </div>
                        ) : (
                            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
                                <AnimatePresence mode="popLayout">
                                    {products.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            {/* Simplified Product Card or import them if they were separate */}
                                            {/* Since they were inlined in page.tsx, I'll keep them here for now */}
                                            <GridProductCard product={product} onAddToCart={() => addToCart(product.id)} onToggleWishlist={() => toggleWishlist(product.id)} inWishlist={isInWishlist(product.id)} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            <AnimatePresence>
                {showMobileFilters && (
                    <div className="fixed inset-0 z-[100] lg:hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 top-0 bottom-0 w-[85%] bg-white p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Filters</h3>
                                <button onClick={() => setShowMobileFilters(false)}><X className="h-5 w-5" /></button>
                            </div>
                            <FilterSidebar facets={facets} activeFilters={filters} onFilterChange={updateFilters} onClearAll={clearFilters} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

function GridProductCard({
    product,
    onAddToCart,
    onToggleWishlist,
    inWishlist,
}: {
    product: Product;
    onAddToCart: () => void;
    onToggleWishlist: () => void;
    inWishlist: boolean;
}) {
    const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    return (
        <div className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border bg-white shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer">
            <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
            <div className="aspect-square relative shrink-0 overflow-hidden bg-gray-50">
                <Image src={product.images?.[0] || '/images/products/kicjen sunk 1.webp'} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                {discount > 0 && <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">-{discount}%</span>}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(); }} className={`absolute top-4 right-4 z-20 h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-all ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400'}`}>
                    <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
            </div>
            <div className="p-6 flex-1 flex flex-col">
                <p className="text-[10px] text-[#1877F2] font-black uppercase tracking-widest mb-1">{product.categoryName}</p>
                <h3 className="font-bold text-lg text-gray-900 leading-tight mb-4 line-clamp-2">
                    {product.name}
                </h3>
                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.mrp > product.price && <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>}
                    </div>
                    <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(); }} disabled={product.stockStatus === "OUT_OF_STOCK"} className="relative z-20 bg-[#1877F2] rounded-2xl h-12 px-6 text-sm font-bold shadow-xl">Add to bag</Button>
                </div>
            </div>
        </div>
    );
}
