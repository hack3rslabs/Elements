"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Grid3X3, ShoppingCart, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { VoiceSearchModal } from "@/components/ai/voice-search";

export function MobileBottomNav() {
    const pathname = usePathname();
    const { cart } = useStore();
    const [voiceOpen, setVoiceOpen] = useState(false);

    const navItems = [
        { icon: Home, label: "Home", href: "/" },
        { icon: Search, label: "Search", href: "#voice", isVoice: true },
        { icon: Grid3X3, label: "Categories", href: "/categories" },
        { icon: ShoppingCart, label: "Cart", href: "/cart", badge: cart.itemCount },
        { icon: User, label: "Account", href: "/login" },
    ];

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t shadow-lg safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map(item => {
                        const isActive = item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href));
                        if (item.isVoice) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setVoiceOpen(true)}
                                    className="flex flex-col items-center justify-center gap-0.5 min-w-[4rem] py-1 relative"
                                    aria-label="Voice search"
                                >
                                    <div className="h-10 w-10 -mt-5 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center shadow-lg">
                                        <Search className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-[#1877F2]">{item.label}</span>
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 min-w-[4rem] py-1 relative transition-colors ${isActive ? 'text-[#1877F2]' : 'text-gray-400'}`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute top-0 right-3 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
            {/* Spacer for bottom nav */}
            <div className="md:hidden h-16" />
            <VoiceSearchModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />
        </>
    );
}

