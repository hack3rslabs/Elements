"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Star } from "lucide-react";

interface Facets {
    materials: string[];
    finishes: string[];
    priceRange: { min: number; max: number };
    counts: { inStock: number; bestSellers: number; newArrivals: number };
}

interface FilterSidebarProps {
    facets: Facets | null;
    activeFilters: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    onFilterChange: (filters: Record<string, any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    onClearAll: () => void;
}

export function FilterSidebar({ facets, activeFilters, onFilterChange, onClearAll }: FilterSidebarProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        price: true,
        material: true,
        finish: true,
        rating: true,
        availability: true,
    });

    const toggleSection = (section: string) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const val = parseInt(value) || 0;
        onFilterChange({ 
            ...activeFilters, 
            [type === 'min' ? 'minPrice' : 'maxPrice']: val 
        });
    };

    const toggleFacet = (type: 'material' | 'finish', value: string) => {
        const current = Array.isArray(activeFilters[type]) ? activeFilters[type] : activeFilters[type] ? [activeFilters[type]] : [];
        const next = current.includes(value) 
            ? current.filter((v: any) => v !== value) // eslint-disable-line @typescript-eslint/no-explicit-any
            : [...current, value];
        onFilterChange({ ...activeFilters, [type]: next });
    };

    const setRating = (rating: number) => {
        onFilterChange({ ...activeFilters, minRating: activeFilters.minRating === rating ? null : rating });
    };

    const toggleStock = () => {
        onFilterChange({ 
            ...activeFilters, 
            stockStatus: activeFilters.stockStatus === 'IN_STOCK' ? null : 'IN_STOCK' 
        });
    };

    if (!facets) return null;

    return (
        <aside className="w-full lg:w-64 space-y-8 bg-white p-6 rounded-2xl border shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-900">Filters</h2>
                <button 
                    onClick={onClearAll}
                    className="text-xs text-[#1877F2] font-semibold hover:underline"
                >
                    Clear All
                </button>
            </div>

            {/* Price Range */}
            <div className="border-t pt-6">
                <button 
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full mb-4 group"
                >
                    <span className="font-semibold text-sm uppercase tracking-wider text-gray-700">Price Range</span>
                    {expanded.price ? <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                </button>
                {expanded.price && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                <input 
                                    type="number" 
                                    placeholder="Min" 
                                    value={activeFilters.minPrice || ''}
                                    onChange={(e) => handlePriceChange('min', e.target.value)}
                                    className="w-full h-9 pl-6 pr-2 rounded-lg border bg-gray-50 text-xs focus:ring-2 focus:ring-[#1877F2]/20 outline-none" 
                                />
                            </div>
                            <span className="text-gray-300">—</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                <input 
                                    type="number" 
                                    placeholder="Max" 
                                    value={activeFilters.maxPrice || ''}
                                    onChange={(e) => handlePriceChange('max', e.target.value)}
                                    className="w-full h-9 pl-6 pr-2 rounded-lg border bg-gray-50 text-xs focus:ring-2 focus:ring-[#1877F2]/20 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[100, 500, 1000, 5000].map(p => (
                                <button 
                                    key={p}
                                    onClick={() => handlePriceChange('max', p.toString())}
                                    className="px-2 py-1 rounded bg-gray-100 text-[10px] font-medium text-gray-600 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-colors"
                                >
                                    Under ₹{p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Availability */}
            <div className="border-t pt-6">
                <button 
                    onClick={() => toggleSection('availability')}
                    className="flex items-center justify-between w-full mb-4 group"
                >
                    <span className="font-semibold text-sm uppercase tracking-wider text-gray-700">Availability</span>
                    {expanded.availability ? <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                </button>
                {expanded.availability && (
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div 
                                onClick={toggleStock}
                                className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${activeFilters.stockStatus === 'IN_STOCK' ? 'bg-[#1877F2] border-[#1877F2]' : 'bg-gray-50 border-gray-300 group-hover:border-[#1877F2]'}`}
                            >
                                {activeFilters.stockStatus === 'IN_STOCK' && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">In Stock only ({facets.counts.inStock})</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Material */}
            {facets.materials.length > 0 && (
                <div className="border-t pt-6">
                    <button 
                        onClick={() => toggleSection('material')}
                        className="flex items-center justify-between w-full mb-4 group"
                    >
                        <span className="font-semibold text-sm uppercase tracking-wider text-gray-700">Material</span>
                        {expanded.material ? <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                    </button>
                    {expanded.material && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {facets.materials.map(m => (
                                <label key={m} className="flex items-center gap-3 cursor-pointer group">
                                    <div 
                                        onClick={() => toggleFacet('material', m)}
                                        className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${activeFilters.material?.includes(m) ? 'bg-[#1877F2] border-[#1877F2]' : 'bg-gray-50 border-gray-300 group-hover:border-[#1877F2]'}`}
                                    >
                                        {activeFilters.material?.includes(m) && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900">{m}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Finish */}
            {facets.finishes.length > 0 && (
                <div className="border-t pt-6">
                    <button 
                        onClick={() => toggleSection('finish')}
                        className="flex items-center justify-between w-full mb-4 group"
                    >
                        <span className="font-semibold text-sm uppercase tracking-wider text-gray-700">Finish</span>
                        {expanded.finish ? <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                    </button>
                    {expanded.finish && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {facets.finishes.map(f => (
                                <label key={f} className="flex items-center gap-3 cursor-pointer group">
                                    <div 
                                        onClick={() => toggleFacet('finish', f)}
                                        className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${activeFilters.finish?.includes(f) ? 'bg-[#1877F2] border-[#1877F2]' : 'bg-gray-50 border-gray-300 group-hover:border-[#1877F2]'}`}
                                    >
                                        {activeFilters.finish?.includes(f) && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900">{f}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Avg. Customer Review */}
            <div className="border-t pt-6">
                <button 
                    onClick={() => toggleSection('rating')}
                    className="flex items-center justify-between w-full mb-4 group"
                >
                    <span className="font-semibold text-sm uppercase tracking-wider text-gray-700">Ratings</span>
                    {expanded.rating ? <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                </button>
                {expanded.rating && (
                    <div className="space-y-2">
                        {[4, 3, 2, 1].map(r => (
                            <button 
                                key={r}
                                onClick={() => setRating(r)}
                                className={`flex items-center gap-2 w-full text-sm py-1 px-2 rounded-lg transition-colors ${activeFilters.minRating === r ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`h-3 w-3 ${star <= r ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <span>& Up</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Badges */}
            <div className="border-t pt-6">
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => onFilterChange({ ...activeFilters, bestSeller: activeFilters.bestSeller === 'true' ? null : 'true' })}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${activeFilters.bestSeller === 'true' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white text-orange-600 border-orange-200 hover:border-orange-500'}`}
                    >
                        BEST SELLERS
                    </button>
                    <button 
                        onClick={() => onFilterChange({ ...activeFilters, newArrival: activeFilters.newArrival === 'true' ? null : 'true' })}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${activeFilters.newArrival === 'true' ? 'bg-[#1877F2] border-[#1877F2] text-white' : 'bg-white text-[#1877F2] border-blue-200 hover:border-[#1877F2]'}`}
                    >
                        NEW ARRIVALS
                    </button>
                </div>
            </div>
        </aside>
    );
}

