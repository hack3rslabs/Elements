"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
    name: string;
    slug: string;
    price: number;
    image: string;
    categoryName?: string;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            // Focus input when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setQuery("");
            setResults([]);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data.products || []);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
                <button 
                    onClick={onClose} 
                    className="p-2 -ml-2 text-gray-500 hover:text-black transition-colors"
                    aria-label="Close search"
                >
                    <X className="h-6 w-6" />
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search sinks, tiles, flooring..."
                        className="w-full h-12 bg-gray-100 rounded-full pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2] mb-4" />
                        <p className="text-sm">Searching for products...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="p-4 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Results</p>
                        {results.map((product) => (
                            <Link
                                key={product.slug}
                                href={`/product/${product.slug}`}
                                onClick={onClose}
                                className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-2xl hover:border-[#1877F2]/30 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <div className="h-16 w-16 bg-gray-50 rounded-xl overflow-hidden relative shrink-0">
                                    <Image
                                        src={product.image || '/images/products/placeholder.webp'}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 font-medium mb-0.5">{product.categoryName}</p>
                                    <h4 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h4>
                                    <p className="text-[#1877F2] font-bold mt-0.5">₹{product.price.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#1877F2] transition-colors">
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : query.length >= 2 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-900">No results found</h3>
                        <p className="text-sm text-gray-500 mt-1">We couldn&apos;t find anything matching &quot;{query}&quot;. Try a different keyword.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6 text-gray-400">
                        <Search className="h-12 w-12 mb-4 opacity-10" />
                        <p className="text-sm">Start typing to search for products</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {['Kitchen Sink', 'Tiles', 'Wash Basin', 'Flooring'].map(term => (
                                <button
                                    key={term}
                                    onClick={() => setQuery(term)}
                                    className="px-4 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
