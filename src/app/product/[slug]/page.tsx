"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Star, Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw, Minus, Plus, Check, Phone, MessageCircle, MapPin, Users, Package, ChevronRight, Download, PlayCircle, Info, Award, Calendar, Ruler, Palette, Weight } from "lucide-react";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

interface ProductDetail {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    price: number;
    mrp: number;
    stockStatus: string;
    stock: number;
    images: string[];
    specifications: Record<string, string>;
    categoryName: string;
    parentCategory: string;
    categoryId: string;
    rating: number;
    reviewCount: number;
    metaTitle: string;
    metaDescription: string;
    sku: string;
    reviews: { id: string; userName: string; rating: number; comment: string; verified: boolean; createdAt: string }[];
    relatedProducts: ProductDetail[];
    tags: string[];
}

// Simulated recent purchase areas
const RECENT_AREAS = [
    { city: "Mumbai", state: "Maharashtra", time: "2 hours ago", buyer: "Builder" },
    { city: "Delhi NCR", state: "Delhi", time: "5 hours ago", buyer: "Contractor" },
    { city: "Ahmedabad", state: "Gujarat", time: "1 day ago", buyer: "Homeowner" },
    { city: "Pune", state: "Maharashtra", time: "1 day ago", buyer: "Architect" },
    { city: "Bangalore", state: "Karnataka", time: "2 days ago", buyer: "Interior Designer" },
    { city: "Jaipur", state: "Rajasthan", time: "3 days ago", buyer: "Contractor" },
    { city: "Lucknow", state: "Uttar Pradesh", time: "3 days ago", buyer: "Homeowner" },
    { city: "Hyderabad", state: "Telangana", time: "4 days ago", buyer: "Builder" },
];

const SPEC_ICONS: Record<string, typeof Ruler> = {
    material: Palette,
    finish: Palette,
    dimensions: Ruler,
    size: Ruler,
    weight: Weight,
    warranty: ShieldCheck,
    thickness: Ruler,
};

export default function ProductPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews" | "installation">("description");
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [bulkQty, setBulkQty] = useState("");
    const [bulkName, setBulkName] = useState("");
    const [bulkPhone, setBulkPhone] = useState("");
    const [bulkSubmitted, setBulkSubmitted] = useState(false);
   
    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        setSelectedImage(0);
        setQuantity(1);
        setActiveTab("description");
        fetch(`/api/products/${encodeURIComponent(slug)}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) setProduct(d.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse space-y-4 max-w-4xl w-full p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-12 bg-gray-200 rounded-full w-full"></div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
                        <p className="text-muted-foreground mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
                        <Link href="/"><Button className="rounded-full">Back to Home</Button></Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    // Rating breakdown (simulated)
    const ratingBreakdown = [
        { stars: 5, pct: 65 },
        { stars: 4, pct: 20 },
        { stars: 3, pct: 10 },
        { stars: 2, pct: 3 },
        { stars: 1, pct: 2 },
    ];

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-gray-50">
                {/* Breadcrumb */}
                <div className="bg-white border-b">
                    <div className="container py-3">
                        <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
                            <Link href="/" className="hover:text-[#1877F2] shrink-0">Home</Link>
                            <ChevronRight className="h-3 w-3 shrink-0" />
                            <Link href={`/category/${product.parentCategory?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="hover:text-[#1877F2] shrink-0">{product.parentCategory}</Link>
                            <ChevronRight className="h-3 w-3 shrink-0" />
                            <span className="text-foreground font-medium truncate">{product.name}</span>
                        </nav>
                    </div>
                </div>

                <div className="container py-4 md:py-8">
                    {/* Product Main Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 bg-white rounded-2xl p-4 md:p-10 shadow-sm border">
                        {/* Images */}
                        <div className="space-y-3">
                            <div className="aspect-square relative rounded-2xl overflow-hidden bg-white border p-4">
                                <Image
                                    src={product.images?.[selectedImage] || product.images?.[0] || '/images/products/kicjen sunk 1.webp'}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                                {product.stockStatus === "MADE_TO_ORDER" && (
                                    <span className="absolute top-3 left-3 md:top-4 md:left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Made to Order</span>
                                )}
                                {discount > 0 && (
                                    <span className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-500 text-white font-bold text-xs md:text-sm px-3 py-1.5 rounded-full">{discount}% OFF</span>
                                )}
                            </div>
                            {product.images.length > 1 && (
                                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1">
                                    {product.images.map((img, i) => (
                                        <button
                                            key={i}
                                            aria-label={`View image ${i + 1}`}
                                            onClick={() => setSelectedImage(i)}
                                            className={`h-16 w-16 md:h-20 md:w-20 relative rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedImage === i ? 'border-[#1877F2] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <Image src={img} alt={`${product.name} view ${i + 1}`} fill className="object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs md:text-sm text-[#1877F2] font-medium uppercase tracking-wider mb-1.5">
                                    {product.parentCategory} / {product.categoryName}
                                </p>
                                <h1 className="text-xl md:text-3xl font-bold text-[#1C1C1E] leading-tight">{product.name}</h1>
                                <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                            </div>

                            {/* Rating */}
                            {product.rating > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-0.5">
                                        {Array(5).fill(0).map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 md:h-5 md:w-5 ${i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-sm md:text-base">{product.rating}</span>
                                    <span className="text-muted-foreground text-xs md:text-sm">({product.reviewCount} reviews)</span>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <Users className="h-3 w-3" /> {product.reviewCount * 3}+ bought
                                    </span>
                                </div>
                            )}

                            {/* Price */}
                            <div className="flex items-end gap-3 pb-4 border-b flex-wrap">
                                <span className="text-3xl md:text-4xl font-bold text-[#1C1C1E]">₹{product.price.toLocaleString("en-IN")}</span>
                                {product.mrp > product.price && (
                                    <>
                                        <span className="text-lg md:text-xl text-muted-foreground line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Save ₹{(product.mrp - product.price).toLocaleString("en-IN")}</span>
                                    </>
                                )}
                            </div>

                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{product.shortDescription}</p>

                            {/* Stock Status */}
                            <div className="flex items-center gap-2">
                                {product.stockStatus === "IN_STOCK" ? (
                                    <><Check className="h-4 w-4 text-green-500" /><span className="text-green-600 font-medium text-sm">In Stock ({product.stock} available)</span></>
                                ) : product.stockStatus === "MADE_TO_ORDER" ? (
                                    <span className="text-amber-600 font-medium text-sm">⚡ Made to Order (7-10 days)</span>
                                ) : (
                                    <span className="text-red-500 font-medium text-sm">Out of Stock</span>
                                )}
                            </div>

                            {/* Quantity + Actions - Desktop */}
                            <div className="hidden md:flex items-center gap-3 flex-wrap">
                                <div className="flex items-center border rounded-full overflow-hidden">
                                    <button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-11 w-11 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-12 text-center font-semibold">{quantity}</span>
                                    <button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)} className="h-11 w-11 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={() => addToCart(product.id, quantity)}
                                    disabled={product.stockStatus === "OUT_OF_STOCK"}
                                    className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-11 px-8 text-sm font-semibold shadow-lg"
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => toggleWishlist(product.id)}
                                    className="h-11 w-11 rounded-full border-2"
                                    aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                </Button>
                            </div>

                            {/* 📞 Contact Section - THE KEY FEATURE */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                                <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Need More Details? Reach Us Instantly
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <WhatsAppButton productName={product.name} className="h-10 px-4 text-sm font-semibold flex-1 justify-center" />
                                    <a
                                        href="tel:+919876543210"
                                        className="inline-flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#0d47a1] text-white rounded-full h-10 px-4 text-sm font-semibold transition-colors shadow-md flex-1"
                                    >
                                        <Phone className="h-4 w-4" /> Call: +91 98765 43210
                                    </a>
                                </div>
                                <p className="text-xs text-green-700 mt-2.5 flex items-center gap-1">
                                    <Info className="h-3 w-3" /> Our experts help with sizing, installation & bulk pricing
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                                {[
                                    { icon: Truck, label: "Free Delivery", sub: "Orders ₹5K+" },
                                    { icon: ShieldCheck, label: "Warranty", sub: product.specifications?.warranty || "10 Yrs" },
                                    { icon: RotateCcw, label: "Easy Returns", sub: "7 Days" },
                                    { icon: Package, label: "Safe Packing", sub: "Double Box" },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2 text-xs md:text-sm">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <item.icon className="h-4 w-4 text-[#1877F2]" />
                                        </div>
                                        <div>
                                            <span className="font-medium block text-xs">{item.label}</span>
                                            <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 📍 Recent Purchase Areas - Social Proof */}
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border p-4 md:p-6">
                        <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-[#1877F2]" /> Recently Purchased In
                        </h3>
                        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {RECENT_AREAS.map((area, i) => (
                                <div key={i} className="shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1877F2]/10 to-blue-50 flex items-center justify-center">
                                        <MapPin className="h-3.5 w-3.5 text-[#1877F2]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">{area.city}</p>
                                        <p className="text-[10px] text-muted-foreground">{area.buyer} • {area.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Trusted by builders, contractors & homeowners across 50+ cities
                        </p>
                    </div>

                    {/* Bulk Inquiry Section */}
                    <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 p-4 md:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 text-orange-900">
                                    <Package className="h-4 w-4" /> Bulk Order / Project Inquiry
                                </h3>
                                <p className="text-xs text-orange-700 mt-1">
                                    Builders, contractors & architects — get special project pricing up to <span className="font-bold">15% off</span>
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowBulkForm(!showBulkForm)}
                                className="shrink-0 rounded-full border-orange-300 text-orange-800 hover:bg-orange-100"
                            >
                                {showBulkForm ? "Close" : "Get Quote"}
                            </Button>
                        </div>
                        {showBulkForm && (
                            <div className="mt-4 space-y-3">
                                {bulkSubmitted ? (
                                    <div className="bg-white rounded-xl p-4 text-center">
                                        <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                                            <Check className="h-6 w-6 text-green-600" />
                                        </div>
                                        <p className="font-semibold text-green-800">Quote Request Sent!</p>
                                        <p className="text-xs text-muted-foreground mt-1">We&apos;ll call you within 2 hours with the best pricing.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            value={bulkName}
                                            onChange={e => setBulkName(e.target.value)}
                                            className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={bulkPhone}
                                            onChange={e => setBulkPhone(e.target.value)}
                                            className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Quantity Needed"
                                            value={bulkQty}
                                            onChange={e => setBulkQty(e.target.value)}
                                            className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                        <Button
                                            onClick={() => setBulkSubmitted(true)}
                                            className="sm:col-span-3 bg-orange-600 hover:bg-orange-700 rounded-full h-10 font-semibold"
                                        >
                                            Submit Bulk Inquiry
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="flex border-b overflow-x-auto scrollbar-hide">
                            {(["description", "specs", "reviews", "installation"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 md:px-8 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors relative shrink-0 ${activeTab === tab
                                        ? 'text-[#1877F2]'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {tab === "description" ? "Description" : tab === "specs" ? "Specifications" : tab === "reviews" ? `Reviews (${product.reviews?.length || 0})` : "Installation"}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2]"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 md:p-8">
                            {activeTab === "description" && (
                                <div className="space-y-6">
                                    <div className="prose max-w-none">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{product.description}</p>
                                    </div>
                                    {/* Key highlights */}
                                    <div>
                                        <h4 className="font-semibold text-sm mb-3">Key Highlights</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {Object.entries(product.specifications || {}).slice(0, 6).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 text-sm">
                                                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border shrink-0">
                                                        {(() => {
                                                            const IconComp = SPEC_ICONS[key.toLowerCase()] || Info;
                                                            return <IconComp className="h-4 w-4 text-[#1877F2]" />;
                                                        })()}
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="block text-xs font-medium">{value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === "specs" && product.specifications && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border">
                                                <span className="font-medium text-xs md:text-sm capitalize text-muted-foreground">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span className="text-xs md:text-sm font-semibold">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Download spec sheet */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                        <Button variant="outline" className="rounded-full text-sm gap-2">
                                            <Download className="h-4 w-4" /> Download Spec Sheet (PDF)
                                        </Button>
                                        <WhatsAppButton
                                            productName={`${product.name} - Need detailed specifications`}
                                            className="h-10 px-4 text-sm font-semibold"
                                        />
                                    </div>
                                </div>
                            )}
                            {activeTab === "reviews" && (
                                <div className="space-y-6">
                                    {/* Rating Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 pb-6 border-b">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-[#1C1C1E]">{product.rating}</div>
                                            <div className="flex items-center justify-center gap-0.5 mt-2">
                                                {Array(5).fill(0).map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{product.reviewCount} reviews</p>
                                            <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                <Award className="h-3 w-3" /> {product.reviewCount > 50 ? "Top Rated" : "Verified"}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {ratingBreakdown.map(r => (
                                                <div key={r.stars} className="flex items-center gap-2">
                                                    <span className="text-xs w-8 shrink-0">{r.stars} ★</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, r.pct))}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-8 text-right">{r.pct}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Individual Reviews */}
                                    {product.reviews?.length > 0 ? product.reviews.map((review) => (
                                        <div key={review.id} className="border-b pb-5 last:border-0">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                                    {review.userName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm">{review.userName}</span>
                                                        {review.verified && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">✓ Verified Buyer</span>}
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 mt-1">
                                                        {Array(5).fill(0).map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
                                    )}
                                </div>
                            )}
                            {activeTab === "installation" && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                            <PlayCircle className="h-5 w-5" /> Installation Guide
                                        </h4>
                                        <div className="space-y-3 text-sm text-blue-800">
                                            <p>📋 <span className="font-medium">Step 1:</span> Measure your space carefully. Refer to product dimensions above.</p>
                                            <p>🔧 <span className="font-medium">Step 2:</span> Prepare the surface — ensure it&apos;s clean, level, and dry.</p>
                                            <p>📐 <span className="font-medium">Step 3:</span> Follow the included installation manual for mounting/fixing.</p>
                                            <p>✅ <span className="font-medium">Step 4:</span> Test for fit and finish. Adjust as needed.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-4 border">
                                            <h5 className="text-sm font-semibold mb-2">📹 Video Tutorial</h5>
                                            <p className="text-xs text-muted-foreground mb-3">Watch our step-by-step installation video for this product.</p>
                                            <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs">
                                                <PlayCircle className="h-3.5 w-3.5" /> Watch Video
                                            </Button>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 border">
                                            <h5 className="text-sm font-semibold mb-2">👷 Need a Professional?</h5>
                                            <p className="text-xs text-muted-foreground mb-3">We can connect you with verified installers in your city.</p>
                                            <a
                                                href="tel:+919876543210"
                                                className="inline-flex items-center gap-2 text-xs text-[#1877F2] font-medium hover:underline"
                                            >
                                                <Phone className="h-3.5 w-3.5" /> Call for Installer Referral
                                            </a>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                        <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                                            <MessageCircle className="h-4 w-4" /> Installation Support Available
                                        </p>
                                        <p className="text-xs text-green-700 mt-1">
                                            Call <a href="tel:+919876543210" className="font-bold underline">+91 98765 43210</a> during installation — our experts will guide you live on the phone.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Products */}
                    {product.relatedProducts?.length > 0 && (
                        <div className="mt-6 md:mt-10">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">You May Also Like</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                {product.relatedProducts.map((rp) => {
                                    const rpDiscount = rp.mrp > rp.price ? Math.round(((rp.mrp - rp.price) / rp.mrp) * 100) : 0;
                                    return (
                                        <Link key={rp.id} href={`/product/${rp.slug}`} className="group block bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all overflow-hidden">
                                            <div className="aspect-square relative overflow-hidden bg-gray-100">
                                                <Image src={rp.images?.[0] || '/images/products/kicjen sunk 1.webp'} alt={rp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                {rpDiscount > 0 && (
                                                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{rpDiscount}% OFF</span>
                                                )}
                                            </div>
                                            <div className="p-3 md:p-4">
                                                <h3 className="font-medium text-xs md:text-sm line-clamp-2 mb-1.5">{rp.name}</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm md:text-lg font-bold">₹{rp.price.toLocaleString("en-IN")}</span>
                                                    {rp.mrp > rp.price && (
                                                        <span className="text-[10px] text-muted-foreground line-through">₹{rp.mrp.toLocaleString("en-IN")}</span>
                                                    )}
                                                </div>
                                                {rp.rating > 0 && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-[10px] font-medium">{rp.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Sticky Bottom Action Bar */}
                <div className="md:hidden fixed bottom-16 left-0 right-0 z-[90] bg-white/95 backdrop-blur-xl border-t shadow-lg p-3 flex items-center gap-2">
                    <div className="flex-1">
                        <span className="text-lg font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.mrp > product.price && (
                            <span className="text-xs text-muted-foreground line-through ml-1">₹{product.mrp.toLocaleString("en-IN")}</span>
                        )}
                    </div>
                    <Button
                        onClick={() => addToCart(product.id, quantity)}
                        disabled={product.stockStatus === "OUT_OF_STOCK"}
                        className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-10 px-6 text-sm font-semibold shadow-lg"
                    >
                        <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
                    </Button>
                    <a
                        href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I need details about: ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md shrink-0"
                        aria-label="WhatsApp inquiry"
                    >
                        <MessageCircle className="h-5 w-5" />
                    </a>
                </div>
            </main>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}
