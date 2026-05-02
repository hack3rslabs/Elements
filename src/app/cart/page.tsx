"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import {
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    ArrowRight,
    Tag,
} from "lucide-react";

export default function CartPage() {
    const { cart, updateCartQuantity, removeFromCart, isInitialized } = useStore();

    const MAX_QTY = 10;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1 bg-gray-50">
                <div className="container py-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Link href="/" className="hover:text-[#1877F2]">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">
                            Shopping Cart
                        </span>
                    </nav>

                    <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

                    {/* ✅ FIX: Prevent flicker */}
                    {!isInitialized ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
                            <p className="text-lg font-medium">Loading cart...</p>
                        </div>
                    ) : cart.items.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
                            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold mb-2">
                                Your cart is empty
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Looks like you haven&apos;t added anything yet.
                            </p>
                            <Link href="/">
                                <Button className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full px-8 h-11">
                                    Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {cart.items.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="flex gap-4 md:gap-6 bg-white rounded-2xl p-4 md:p-6 shadow-sm border hover:shadow-md transition-all"
                                    >
                                        {/* Image */}
                                        <Link
                                            href={`/product/${item.product.slug}`}
                                            className="w-24 h-24 md:w-32 md:h-32 relative shrink-0 rounded-xl overflow-hidden bg-gray-100"
                                        >
                                            <Image
                                                src={
                                                    item.product.images?.[0] ||
                                                    "/images/products/kitchen-sink-1.webp"
                                                }
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </Link>

                                        <div className="flex-1 flex flex-col justify-between">
                                            {/* Title + Price */}
                                            <div>
                                                <Link
                                                    href={`/product/${item.product.slug}`}
                                                    className="font-semibold text-base hover:text-[#1877F2] line-clamp-2"
                                                >
                                                    {item.product.name}
                                                </Link>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-lg font-bold">
                                                        ₹{item.product.price.toLocaleString("en-IN")}
                                                    </span>

                                                    {item.product.mrp > item.product.price && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            ₹{item.product.mrp.toLocaleString("en-IN")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex items-center justify-between mt-4">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center border rounded-full overflow-hidden">
                                                    {/* Decrease */}
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity === 1) {
                                                                removeFromCart(item.productId);
                                                            } else {
                                                                updateCartQuantity(
                                                                    item.productId,
                                                                    item.quantity - 1
                                                                );
                                                            }
                                                        }}
                                                        className="h-9 w-9 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>

                                                    {/* Quantity */}
                                                    <span className="w-10 text-center font-semibold text-sm">
                                                        {item.quantity}
                                                    </span>

                                                    {/* Increase */}
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity < MAX_QTY) {
                                                                updateCartQuantity(
                                                                    item.productId,
                                                                    item.quantity + 1
                                                                );
                                                            }
                                                        }}
                                                        className="h-9 w-9 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                {/* Price + Remove */}
                                                <div className="flex items-center gap-4">
                                                    <span className="text-lg font-bold text-[#1877F2]">
                                                        ₹
                                                        {(item.product.price * item.quantity).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>

                                                    <button
                                                        onClick={() =>
                                                            removeFromCart(item.productId)
                                                        }
                                                        className="h-9 w-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24">
                                    <h3 className="text-lg font-bold mb-6">Order Summary</h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                MRP Total
                                            </span>
                                            <span>
                                                ₹{cart.mrpTotal.toLocaleString("en-IN")}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount</span>
                                            <span>
                                                - ₹{cart.savings.toLocaleString("en-IN")}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Delivery
                                            </span>
                                            <span className="text-green-600 font-medium">
                                                {cart.subtotal >= 5000 ? "FREE" : "₹99"}
                                            </span>
                                        </div>

                                        <div className="border-t pt-3 flex justify-between font-bold">
                                            <span>Total</span>
                                            <span className="text-[#1877F2]">
                                                ₹
                                                {(
                                                    cart.subtotal +
                                                    (cart.subtotal >= 5000 ? 0 : 99)
                                                ).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    </div>

                                    {cart.savings > 0 && (
                                        <div className="bg-green-50 text-green-700 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            You&apos;re saving ₹
                                            {cart.savings.toLocaleString("en-IN")}
                                        </div>
                                    )}

                                    <Link href="/checkout">
                                        <Button className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-12">
                                            Proceed to Checkout
                                        </Button>
                                    </Link>

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}