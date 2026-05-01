"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Star, SlidersHorizontal, Grid3X3, LayoutList, Heart, Filter, X } from "lucide-react";
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

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
    
    const [category, setCategory] = useState<CategoryData | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [facets, setFacets] = useState<Facets | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
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

    const updateFilters = (newFilters: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setFilters(newFilters);
        // Update URL
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

    // Fetch Category Meta
    useEffect(() => {
        fetch(`/api/categories/${slug}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) setCategory(d.data);
            });
    }, [slug]);

    // Fetch Products with Filters
    const fetchProducts = useCallback(() => {
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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchProducts]);

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-gray-50 pb-20">
                {/* Category Banner */}
                <section className="relative bg-gradient-to-r from-[#0d47a1] to-[#1877F2] py-5 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/images/products/k%20s%202.jpg')] bg-cover bg-center opacity-10"></div>
                    <div className="container relative z-10 text-white">
                        <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-up">
                            <Link href="/" className="hover:text-white transition-colors hover-underline">Home</Link>
                            <span>/</span>
                            <span className="text-white font-medium">{category?.name || slug}</span>
                        </nav>
                        <ScrollReveal direction="up">
                            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">{category?.name || slug}</h1>
                        </ScrollReveal>
                        {category?.description && (
                            <ScrollReveal direction="up" delay={0.15}>
                                <p className="text-white/80 mt-4 text-sm max-w-sm leading-relaxed">{category.description}</p>
                            </ScrollReveal>
                        )}
                            <ScrollReveal direction="up" delay={0.25}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mt-8">
                                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-white/90 text-sm font-medium">{products.length}  Products Available</span>
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
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-white rounded-2xl shadow-sm border">
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

                            {/* Active Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {filters.material.map(m => (
                                    <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm animate-fade-in">
                                        {m}
                                        <button onClick={() => updateFilters({ ...filters, material: filters.material.filter(x => x !== m) })}><X className="h-3 w-3 text-gray-400 hover:text-red-500" /></button>
                                    </span>
                                ))}
                                {filters.finish.map(f => (
                                    <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm animate-fade-in">
                                        {f}
                                        <button onClick={() => updateFilters({ ...filters, finish: filters.finish.filter(x => x !== f) })}><X className="h-3 w-3 text-gray-400 hover:text-red-500" /></button>
                                    </span>
                                ))}
                                {(filters.minPrice || filters.maxPrice) && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-[#1877F2]">
                                        ₹{filters.minPrice || 0} - ₹{filters.maxPrice || '∞'}
                                        <button onClick={() => updateFilters({ ...filters, minPrice: "", maxPrice: "" })}><X className="h-3 w-3 text-blue-400 hover:text-red-500" /></button>
                                    </span>
                                )}
                            </div>

                            {/* Results */}
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl border p-4 space-y-4 animate-pulse">
                                            <div className="aspect-square bg-gray-100 rounded-xl" />
                                            <div className="h-4 bg-gray-100 rounded w-2/3" />
                                            <div className="h-4 bg-gray-100 rounded w-full" />
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="h-6 bg-gray-100 rounded w-20" />
                                                <div className="h-9 bg-gray-100 rounded-full w-24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300">
                                    <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Filter className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No items match your filters</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mb-8">Try adjusting your price range or selection to find what you&apos;re looking for.</p>
                                    <Button onClick={clearFilters} className="rounded-full bg-[#1877F2] hover:bg-[#0d47a1] px-8">
                                        Reset All Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className={viewMode === "grid"
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                                    : "space-y-6"
                                }>
                                    <AnimatePresence mode="popLayout">
                                        {products.map((product, idx) => (
                                            <motion.div
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            >
                                                {viewMode === "grid" ? (
                                                    <GridProductCard product={product} onAddToCart={() => addToCart(product.id)} onToggleWishlist={() => toggleWishlist(product.id)} inWishlist={isInWishlist(product.id)} />
                                                ) : (
                                                    <ListProductCard product={product} onAddToCart={() => addToCart(product.id)} onToggleWishlist={() => toggleWishlist(product.id)} inWishlist={isInWishlist(product.id)} />
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Filter Modal */}
            <AnimatePresence>
                {showMobileFilters && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm lg:hidden"
                            onClick={() => setShowMobileFilters(false)}
                        />
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-xs bg-white z-[70] lg:hidden overflow-y-auto"
                        >
                            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="font-bold">Filters</h3>
                                <button onClick={() => setShowMobileFilters(false)}><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-4 pt-0">
                                <FilterSidebar 
                                    facets={facets} 
                                    activeFilters={filters} 
                                    onFilterChange={updateFilters}
                                    onClearAll={clearFilters}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}

function ChevronDown({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>;
}

function GridProductCard({ product, onAddToCart, onToggleWishlist, inWishlist }: { product: Product; onAddToCart: () => void; onToggleWishlist: () => void; inWishlist: boolean }) {
    const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    return (
        <div className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border bg-white shadow-sm hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 border-gray-100 hover:border-transparent">
            <div className="aspect-[4/5] relative shrink-0 overflow-hidden bg-gray-50">
                <Image src={product.images?.[0] || '/images/products/kicjen sunk 1.webp'} alt={product.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {discount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg transform -rotate-1 group-hover:rotate-0 transition-transform tracking-tighter">-{discount}%</span>
                    )}
                    {product.isNewArrival && (
                        <span className="bg-[#1877F2] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg tracking-tighter">NEW</span>
                    )}
                </div>

                <button
                    onClick={(e) => { e.preventDefault(); onToggleWishlist(); }}
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    className={`absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
                >
                    <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>

                {product.stockStatus === "OUT_OF_STOCK" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-white text-black font-black px-6 py-2.5 rounded-full text-xs uppercase tracking-widest shadow-xl">Waitlist Only</span>
                    </div>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[#1877F2] font-black uppercase tracking-[0.2em]">{product.categoryName}</p>
                    {product.rating > 0 ? (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md min-h-[24px]">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-900">{product.rating}</span>
                        </div>
                    ) : (
                        <div className="min-h-[24px]"></div>
                    )}
                </div>
                
                <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-[#1877F2] transition-colors">
                    <Link href={`/product/${product.slug}`}>{product.name}</Link>
                </h3>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.mrp > product.price && (
                            <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                        )}
                    </div>
                    <Button 
                        onClick={(e) => { e.preventDefault(); onAddToCart(); }} 
                        disabled={product.stockStatus === "OUT_OF_STOCK"} 
                        className="bg-[#1877F2] hover:bg-black rounded-2xl h-12 px-6 text-sm font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        Add to bag
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListProductCard({ product, onAddToCart, onToggleWishlist, inWishlist }: { product: Product; onAddToCart: () => void; onToggleWishlist: () => void; inWishlist: boolean }) {
    const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    return (
        <div className="flex flex-col sm:flex-row gap-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all p-6 group">
            <div className="w-full sm:w-56 aspect-square relative shrink-0 rounded-2xl overflow-hidden bg-gray-50">
                <Image src={product.images?.[0] || '/images/products/kicjen sunk 1.webp'} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">-{discount}%</span>
                )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-[#1877F2] font-black uppercase tracking-[0.2em]">{product.categoryName}</p>
                        <div className="flex items-center gap-1">
                            {Array(5).fill(0).map((_, j) => (
                                <Star key={j} className={`h-3 w-3 ${j < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                            <span className="text-xs font-bold text-gray-400 ml-2">{product.reviewCount} Reviews</span>
                        </div>
                    </div>
                    
                    <h3 className="font-extrabold text-2xl text-gray-900 mb-4 group-hover:text-[#1877F2] transition-colors">
                        <Link href={`/product/${product.slug}`}>{product.name}</Link>
                    </h3>
                    
                    <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed mb-6">
                        Experience world-class quality with our primary {product.categoryName.toLowerCase()}. Crafted for excellence with {product.rating} customer rating. Perfect for modern living spaces.
                    </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.mrp > product.price && (
                            <span className="text-base text-gray-400 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={onToggleWishlist} 
                            className={`h-12 w-12 rounded-2xl transition-all ${inWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'hover:border-red-500 hover:text-red-500'}`}
                        >
                            <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                        </Button>
                        <Button 
                            onClick={onAddToCart} 
                            disabled={product.stockStatus === "OUT_OF_STOCK"} 
                            className="bg-[#1877F2] hover:bg-black rounded-2xl h-12 px-8 text-sm font-black shadow-xl shadow-blue-500/20"
                        >
                            Add to bag
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

