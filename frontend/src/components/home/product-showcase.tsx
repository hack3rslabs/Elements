"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  image?: string;
  images?: string[];
  categoryName: string;
  parentCategory: string;
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  shortDescription?: string;
  tags?: string[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function ProductShowcase({ products }: { products: Product[] }) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  return (
    <section className="py-0 md:py-0 bg-gray">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1E]">
            Our Products
          </h2>
          <p className="text-muted-foreground mt-2 md:mt-3 text-sm md:text-lg">
            Explore our complete range — tap any product for full details
          </p>
        </motion.div>

        {(!products || products.length === 0) ? (
          <div className="text-center text-gray-500 py-10">
            No products available
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 items-stretch">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                className="h-full"
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={() => addToCart(product.id)}
                  onToggleWishlist={() => toggleWishlist(product.id)}
                  isWishlisted={isInWishlist(product.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted }: {
  product: Product;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
}) {
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const imageUrl = product.images?.[0] || product.image || '/images/products/kicjen sunk 1.webp';

  return (
    <div className="group relative flex flex-col h-full overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-500">
      <div className="aspect-square relative shrink-0 overflow-hidden bg-gray-50">
        <Image src={imageUrl} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md">
            {discount}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            ⭐ BEST
          </span>
        )}
        {product.isNewArrival && !product.isBestSeller && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-[#1877F2] to-blue-600 text-white text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            NEW
          </span>
        )}
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link href={`/product/${product.slug}`} className="bg-white rounded-full px-4 py-2 text-xs font-semibold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
            <Eye className="h-3 w-3" /> View Details
          </Link>
        </div>
        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist(); }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} stroke="currentColor" strokeWidth="2" fill={isWishlisted ? "currentColor" : "none"}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="p-3 md:p-4 flex-1 flex flex-col">
        <p className="text-[10px] md:text-xs text-[#1877F2] font-medium uppercase tracking-wider mb-0.5">{product.categoryName}</p>
        <h3 className="font-medium text-xs md:text-sm leading-tight mb-1.5">
          <Link href={`/product/${product.slug}`} className="hover:text-[#1877F2] transition-colors">{product.name}</Link>
        </h3>
        
        <div className="mt-auto">
          {product.rating > 0 ? (
            <div className="flex items-center gap-1 mb-1.5 min-h-[16px]">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] md:text-xs font-medium">{product.rating}</span>
              <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
            </div>
          ) : <div className="mb-1.5 min-h-[16px]" />}
          
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-sm md:text-lg font-bold text-[#1C1C1E]">₹{product.price.toLocaleString("en-IN")}</span>
              {product.mrp > product.price && (
                <span className="text-[10px] md:text-xs text-muted-foreground line-through ml-1">₹{product.mrp.toLocaleString("en-IN")}</span>
              )}
            </div>
            <Button size="sm" onClick={(e) => { e.preventDefault(); onAddToCart(); }} className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-7 md:h-9 px-2.5 md:px-4 text-[10px] md:text-xs font-semibold shadow-md">
              <ShoppingCart className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {/* Contact shortcut on mobile */}
          <a
            href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I need details about: ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 text-[10px] md:text-xs text-green-700 bg-green-50 rounded-full py-1.5 font-medium hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="h-3 w-3" /> WhatsApp for Details
          </a>
        </div>
      </div>
    </div>
  );
}
