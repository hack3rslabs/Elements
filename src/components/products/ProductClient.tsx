"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star, Heart, ShoppingCart, ShieldCheck, RotateCcw, Minus, Plus, Check, Phone, MessageCircle, Users, Package, ChevronRight, Info, Ruler, Palette, Weight } from "lucide-react";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

interface ProductVariant {
    color?: string;
    price?: number | string;
    mrp?: number | string;
    stock?: number | string;
    images?: string[];
}

interface RelatedProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    images: string[];
    rating: number;
}

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
    relatedProducts: RelatedProduct[];
    tags: string[];
    variants?: ProductVariant[];
}



export default function ProductClient({ product }: { product: ProductDetail }) {
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [bulkQty, setBulkQty] = useState("");
    const [bulkName, setBulkName] = useState("");
    const [bulkPhone, setBulkPhone] = useState("");
    const [bulkSubmitted, setBulkSubmitted] = useState(false);

    const activeVariants = product.variants && product.variants.length > 0
        ? product.variants
        : [];

    const currentVariant = selectedVariant || activeVariants[0];
    const currentPrice = Number(currentVariant?.price ?? product.price);
    const currentMrp = Number(currentVariant?.mrp ?? product.mrp);
    const discount = currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
    const currentStockStatus = currentVariant ? (Number(currentVariant.stock ?? 0) > 0 ? "IN_STOCK" : "OUT_OF_STOCK") : product.stockStatus;
    const displayImages = currentVariant && currentVariant.images && currentVariant.images.length > 0 ? currentVariant.images : product.images;

    return (
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
                    <div className="space-y-3">
                        <div className="aspect-square relative rounded-2xl overflow-hidden bg-white border p-4 max-w-[80%] mx-auto">
                            <Image
                                src={displayImages?.[selectedImage] || displayImages?.[0] || '/images/products/kicjen sunk 1.webp'}
                                alt={product.name}
                                fill
                                className="object-contain"
                                priority
                            />
                            {currentStockStatus === "MADE_TO_ORDER" && (
                                <span className="absolute top-3 left-3 md:top-4 md:left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Made to Order</span>
                            )}
                            {discount > 0 && (
                                <span className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-500 text-white font-bold text-xs md:text-sm px-3 py-1.5 rounded-full">{discount}% OFF</span>
                            )}
                        </div>
                        {displayImages.length > 1 && (
                            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1">
                                {displayImages.map((img: string, i: number) => (
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
                            <span className="text-3xl md:text-4xl font-bold text-[#1C1C1E]">₹{currentPrice.toLocaleString("en-IN")}</span>
                            {currentMrp > currentPrice && (
                                <>
                                    <span className="text-lg md:text-xl text-muted-foreground line-through">₹{currentMrp.toLocaleString("en-IN")}</span>
                                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Save ₹{(currentMrp - currentPrice).toLocaleString("en-IN")}</span>
                                </>
                            )}
                        </div>

                        {product.shortDescription && (
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{product.shortDescription}</p>
                        )}

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
                                onClick={() => addToCart(product.id, quantity, currentVariant?.color)}
                                disabled={currentStockStatus === "OUT_OF_STOCK"}
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

                        {/* 📞 Contact Section */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                            <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Need More Details? Reach Us Instantly
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <WhatsAppButton productName={currentVariant ? `${product.name} (${currentVariant.color})` : product.name} className="h-10 px-4 text-sm font-semibold flex-1 justify-center" />
                                <a
                                    href="tel:+919496664445"
                                    className="inline-flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#0d47a1] text-white rounded-full h-10 px-4 text-sm font-semibold transition-colors shadow-md flex-1"
                                >
                                    <Phone className="h-4 w-4" /> Call: +91 94966 64445
                                </a>
                            </div>
                            <p className="text-xs text-green-700 mt-2.5 flex items-center gap-1">
                                <Info className="h-3 w-3" /> Our experts help with sizing, installation & bulk pricing
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                            {[
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

                        {/* Color selection */}
                        {activeVariants.length > 0 && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/60 rounded-2xl p-4 mt-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                                        Available Colors
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#1877F2] bg-blue-50/80 px-2.5 py-0.5 rounded-full">
                                            {currentVariant?.color || "Select Finish"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {activeVariants.map((v: ProductVariant, index: number) => {
                                        const colorName = (v.color || "").toLowerCase().trim();
                                        const COLOR_LOOKUP: Record<string, string> = {
                                           "chrome": "#C0C0C0",
                                           "silver": "#C0C0C0",
                                           "matt black": "#1A1A1A",
                                           "black": "#000000",
                                           "rose gold": "#B76E79",
                                            "gold": "#D4AF37",
                                            "antique gold": "#AA7C11",
                                             "brushed steel": "#8C9AA3",
                                             "grey": "#808080",
                                             "gray": "#808080",
                                             "bronze": "#CD7F32",
                                             "white": "#FFFFFF",

                                        "matte white": "#F5F5F5",
                                        "space grey": "#4B5563",
                                        "gunmetal": "#2C3539",
                                        "copper": "#B87333",
                                        "metallic blue": "#32527B",
                                        "navy blue": "#1E3A8A",
                                         "royal blue": "#4169E1",
                                           "sky blue": "#87CEEB",
                                            "teal": "#008080",
                                          "emerald green": "#50C878",
                                          "forest green": "#228B22",
                                          "olive green": "#556B2F",
                                           "lime green": "#32CD32",
                                            "red": "#DC2626",
                                          "crimson": "#DC143C",
                                          "maroon": "#800000",
                                          "orange": "#FF8C00",
                                          "amber": "#FFBF00",
                                           "yellow": "#FFD700",
                                           "purple": "#800080",
                                            "violet": "#8F00FF",
                                             "pink": "#FFC0CB",
                                            "hot pink": "#FF69B4",
                                            "pearl white": "#F8F6F0",
                                            "ivory": "#FFFFF0",
                                           "champagne": "#F7E7CE",
                                            "charcoal": "#36454F",
                                            "graphite": "#383838",
                                           "coffee brown": "#6F4E37",
                                            "wood finish": "#A47149",
                                               "rust": "#B7410E",
                                            "titanium": "#878681",
                                           "platinum": "#E5E4E2",
                                          "midnight black": "#0A0A0A",
                                        "ice blue": "#D6F1FF",

                                         "coffee": "#6F4E37",
                                      "antique red": "#A63D40",
                                       "dove grey": "#B0B7BD",
                                       "steel grey": "#708090",}
                                        
                                           let swatchBg = COLOR_LOOKUP[colorName];
                                        if (!swatchBg) {
                                            let hash = 0;
                                            for (let i = 0; i < colorName.length; i++) {
                                                hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
                                            }
                                            const h = Math.abs(hash % 360);
                                            swatchBg = `linear-gradient(135deg, hsl(${h}, 70%, 75%) 0%, hsl(${h}, 60%, 55%) 50%, hsl(${h}, 70%, 40%) 100%)`;
                                        }
                                        
                                        const isSelected = currentVariant?.color === v.color;
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVariant(v);
                                                    setSelectedImage(0);
                                                }}
                                                className={`group relative h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center ${isSelected ? 'ring-2 ring-offset-2 ring-[#1877F2] scale-105 shadow-md' : 'ring-1 ring-black/10'}`}
                                                style={{ background: swatchBg }}
                                                title={v.color}
                                            >
                                                <span className="sr-only">{v.color}</span>
                                                {isSelected && (
                                                    <span className={`h-2.5 w-2.5 rounded-full ${colorName.includes("white") || colorName.includes("chrome") || colorName.includes("silver") ? 'bg-black' : 'bg-white'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
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

                {/* Product Description & Specifications */}
                {(product.description || Object.keys(product.specifications || {}).length > 0) && (
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="border-b px-4 md:px-6 py-4">
                            <h2 className="text-lg md:text-xl font-bold text-[#1C1C1E]">Product Details</h2>
                        </div>
                        <div className="p-4 md:p-6 space-y-6">
                            {product.description && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Description</h3>
                                    <div className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                                        {product.description}
                                    </div>
                                </div>
                            )}
                            {Object.keys(product.specifications || {}).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Specifications</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 shrink-0 pt-0.5 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-sm text-gray-800 font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-[90] bg-white border-t p-3 flex items-center gap-2">
                <div className="flex-1">
                    <span className="text-lg font-bold">₹{currentPrice.toLocaleString("en-IN")}</span>
                    {currentMrp > currentPrice && (
                        <span className="text-xs text-muted-foreground line-through ml-1">₹{currentMrp.toLocaleString("en-IN")}</span>
                    )}
                </div>
                <Button
                    onClick={() => addToCart(product.id, quantity, currentVariant?.color)}
                    disabled={currentStockStatus === "OUT_OF_STOCK"}
                    className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-10 px-6 text-sm font-semibold shadow-lg"
                >
                    <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
                </Button>
                <a
                    href={`https://wa.me/919496664445?text=${encodeURIComponent(`Hi! I need details about: ${currentVariant ? `${product.name} (${currentVariant.color})` : product.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md shrink-0"
                    aria-label="WhatsApp inquiry"
                >
                    <MessageCircle className="h-5 w-5" />
                </a>
            </div>
            <MobileBottomNav />
        </main>
    );
}
