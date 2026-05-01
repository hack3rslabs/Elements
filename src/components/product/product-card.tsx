import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export interface Product {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating?: number;
    reviews?: number;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
   return (
  <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md  flex flex-col">

    {/* IMAGE */}
    <div className="aspect-square relative overflow-hidden bg-muted ">
      <Image
        src={product.image}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Wishlist Button */}
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full shadow-sm"
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
        >
          <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="sr-only">Add to Wishlist</span>
        </Button>
      </div>

      {/* Discount Badge */}
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="absolute left-2 top-2 z-10">
          <span className="rounded bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
            {Math.round(
              ((product.originalPrice - product.price) / product.originalPrice) * 100
            )}% OFF
          </span>
        </div>
      )}
    </div>

    {/* CONTENT */}
    <div className="p-4 flex flex-col flex-1">

      {/* Category */}
      <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wide">
        {product.category}
      </div>

      {/* Product Name */}
      <h3 className="line-clamp-2 text-sm font-medium leading-tight mb-2 min-h-[40px]">
        <Link href={`/product/${product.slug}`} className="hover:underline">
          {product.name}
        </Link>
      </h3>

      {/* PRICE + BUTTON */}
      <div className="flex items-center justify-between mt-auto">

        {/* Price Section */}
        <div className="flex flex-col">
          <span className="text-lg font-bold">
            ₹{product.price.toLocaleString("en-IN")}
          </span>

          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <Button 
          size="icon" 
          className="h-9 w-9"
          onClick={(e) => { e.preventDefault(); addToCart(product.id); }}
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="sr-only">Add to Cart</span>
        </Button>

      </div>
    </div>
  </div>
);
}
