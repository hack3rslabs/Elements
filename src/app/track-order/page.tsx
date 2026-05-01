"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    Search, Package, Truck,
    CheckCircle2, Clock, MapPin,
    AlertCircle, Ban
} from "lucide-react";
import Image from "next/image";

interface Order {
    id: string;
    status: string;
    items: {
        productId: string;
        quantity: number;
        product: {
            name: string;
            image: string;
            price: number;
        };
    }[];
    total: number;
    subtotal: number;
    shipping: number;
    createdAt: string;
    timeline: { status: string; time: string; description: string; }[];
    customer: { address: string; city: string; state: string; pincode: string; };
    transportChoice: string;
}

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get("id") || "";

    const [orderId, setOrderId] = useState(initialId);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const handleTrack = useCallback(async (idToTrack = orderId) => {
        if (!idToTrack) return;
        await Promise.resolve(); // Avoid synchronous setState in effect
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/orders/${idToTrack}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.data as Order);
            } else {
                setOrder(null);
                setError(data.message || "Order not found");
            }
        } catch {
            setError("Failed to fetch order details. Please try again.");
        }
        setLoading(false);
    }, [orderId]);

    useEffect(() => {
        if (initialId) {
            void Promise.resolve().then(() => handleTrack(initialId));
        }
    }, [initialId, handleTrack]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="h-6 w-6 text-amber-500" />;
            case 'PROCESSING': return <Package className="h-6 w-6 text-blue-500" />;
            case 'SHIPPED': return <Truck className="h-6 w-6 text-[#1877F2]" />;
            case 'DELIVERED': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
            case 'CANCELLED': return <Ban className="h-6 w-6 text-rose-500" />;
            default: return <Clock className="h-6 w-6 text-gray-400" />;
        }
    };

    return (
        <div className="container py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
                    <p className="text-gray-500">Enter your order ID to see real-time updates on your delivery status.</p>
                </div>

                {/* Track Search Box */}
                <div className="bg-white rounded-3xl p-4 shadow-xl border flex gap-4 max-w-xl mx-auto mb-12 group focus-within:ring-4 focus-within:ring-[#1877F2]/10 transition-all">
                    <div className="flex-1 flex items-center pl-4 gap-3">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                        <input
                            type="text"
                            placeholder="ORD-123456"
                            className="w-full outline-none bg-transparent font-semibold uppercase placeholder:text-gray-300"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                        />
                    </div>
                    <Button
                        onClick={() => handleTrack()}
                        disabled={loading || !orderId}
                        className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl px-8 h-12 shadow-lg"
                    >
                        {loading ? "Searching..." : "Track Now"}
                    </Button>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 max-w-xl mx-auto animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {order && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-3xl p-6 border shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Order ID</p>
                                <p className="text-xl font-bold text-[#1877F2]">{order.id}</p>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current Status</p>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(order.status)}
                                    <span className="font-bold">{order.status}</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Estimated Delivery</p>
                                <p className="text-xl font-bold">3 - 5 Days</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Tracking Timeline */}
                            <div className="lg:col-span-2 bg-white rounded-3xl p-8 border shadow-sm">
                                <h3 className="text-lg font-bold mb-8">Tracking Timeline</h3>
                                <div className="space-y-10 relative">
                                    {/* Timeline connector */}
                                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />

                                    {(order.timeline || []).map((step, i) => (
                                        <div key={i} className="flex gap-6 relative">
                                            <div className={`mt-1 h-6 w-6 rounded-full border-4 border-white shadow-md z-10 ${i === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            <div>
                                                <p className="font-bold text-sm leading-none">{step.status}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 mb-2">
                                                    {new Date(step.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Future steps */}
                                    {['Processing', 'In Transit', 'Out for Delivery', 'Delivered'].slice((order.timeline?.length || 0) - 1).map((step) => (
                                        <div key={step} className="flex gap-6 relative opacity-20 filter grayscale">
                                            <div className="mt-1 h-6 w-6 rounded-full border-4 border-white shadow-md bg-gray-200 z-10" />
                                            <div>
                                                <p className="font-bold text-sm leading-none">{step}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Upcoming step in your delivery journey.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Recap */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-3xl p-6 border shadow-sm">
                                    <h3 className="text-sm font-bold mb-4">Order Summary</h3>
                                    <div className="space-y-4 mb-6">
                                        {(order.items || []).map((item) => (
                                            <div key={item.productId} className="flex gap-3">
                                                <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0 bg-gray-50 border">
                                                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-medium line-clamp-1">{item.product.name}</p>
                                                    <p className="text-[9px] text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-[11px] font-bold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Shipping</span>
                                            <span>₹{order.shipping.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                                            <span>Total Paid</span>
                                            <span className="text-[#1877F2]">₹{order.total.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                                    <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Destination
                                    </h4>
                                    <p className="text-xs text-white/90 leading-relaxed">
                                        {order.customer.address},<br />
                                        {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                                    </p>
                                    <div className="mt-6 pt-4 border-t border-white/10">
                                        <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider mb-1">Transport Mode</p>
                                        <p className="text-xs font-bold flex items-center gap-2">
                                            <Truck className="h-3 w-3" />
                                            {order.transportChoice.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <div className="flex min-h-screen flex-col bg-gray-50/20">
            <Header />
            <main className="flex-1">
                <Suspense fallback={<div className="container py-20 text-center">Loading tracker...</div>}>
                    <TrackOrderContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

