"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Home, ShoppingBag, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex flex-col items-center justify-center px-4 py-16">
            {/* Animated 404 */}
            <div className="relative mb-8">
                <div className="text-[10rem] md:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-[#1877F2] to-[#0d47a1] leading-none select-none opacity-20">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-100/50 border border-white/50 px-8 py-6 text-center">
                        <Image
                            src="/images/brand/elements-logo.png"
                            alt="Elements"
                            width={120}
                            height={36}
                            className="h-10 w-auto object-contain mx-auto mb-4"
                        />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                        <p className="text-sm text-gray-500 max-w-sm">
                            The page you&apos;re looking for doesn&apos;t exist or has been moved.
                            Let&apos;s get you back on track.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for products, categories..."
                        className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all shadow-sm"
                    />
                </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] transition-all shadow-md shadow-blue-200"
                >
                    <Home className="h-4 w-4" />
                    Home Page
                </Link>
                <Link
                    href="/category/kitchen"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                    <ShoppingBag className="h-4 w-4" />
                    Browse Products
                </Link>
            </div>

            {/* Footer */}
            <p className="mt-12 text-xs text-gray-400">
                Sree Kameswari Hindustan Elements &bull; Premium Home D&eacute;cor &amp; Construction
            </p>
        </div>
    );
}
