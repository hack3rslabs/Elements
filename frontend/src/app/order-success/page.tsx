"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2, Download, Package,
    ArrowRight, MapPin, Truck, Share2
} from "lucide-react";
import { Suspense } from "react";

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id");

    return (
        <div className="container py-20 px-4">
            <div className="max-w-2xl mx-auto text-center">
                <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in duration-500">
                    <CheckCircle2 className="h-12 w-12" />
                </div>

                <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
                <p className="text-gray-500 text-lg mb-8">
                    Thank you for choosing Elements Hindustan. Your order <span className="text-[#1877F2] font-bold">#{orderId}</span> has been received and is being processed.
                </p>

                <div className="bg-white rounded-3xl p-8 border shadow-sm mb-10 text-left space-y-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1877F2] flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Track Your Progress</h3>
                            <p className="text-xs text-muted-foreground mt-1">You can track your real-time delivery status using the button below or via your email updates.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1877F2] flex items-center justify-center shrink-0">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Delivery Estimate</h3>
                            <p className="text-xs text-muted-foreground mt-1">Most orders are delivered within 3-5 business days depending on your location and transport choice.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex flex-wrap gap-4">
                        <Button className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full px-8 h-12 shadow-lg font-bold">
                            <Download className="mr-2 h-4 w-4" /> Download Invoice (PDF)
                        </Button>
                        <Link href={`/track-order?id=${orderId}`}>
                            <Button variant="outline" className="rounded-full px-8 h-12 border-2">
                                <MapPin className="mr-2 h-4 w-4" /> Track Order
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/">
                        <Button variant="link" className="text-gray-500 hover:text-[#1877F2]">
                            Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" className="text-gray-500 rounded-full">
                        <Share2 className="mr-2 h-4 w-4" /> Share with colleagues
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <div className="flex min-h-screen flex-col bg-gray-50/30">
            <Header />
            <main className="flex-1">
                <Suspense fallback={<div className="container py-20 text-center">Loading confirmation...</div>}>
                    <OrderSuccessContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
