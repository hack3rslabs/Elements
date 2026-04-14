import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    return (
        <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
            <div className="aspect-square relative overflow-hidden bg-muted">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                        <Heart className="h-4 w-4" />
                        <span className="sr-only">Add to Wishlist</span>
                    </Button>
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute left-2 top-2 z-10">
                        <span className="rounded bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wide">
                    {product.category}
                </div>
                <h3 className="line-clamp-2 text-sm font-medium leading-tight mb-2 h-10">
                    <Link href={`/product/${product.slug}`} className="hover:underline">
                        {product.name}
                    </Link>
                </h3>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.originalPrice && (
                            <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                        )}
                    </div>
                    <Button size="icon" className="h-9 w-9">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="sr-only">Add to Cart</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
