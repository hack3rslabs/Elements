"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Grid3X3, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { SearchModal } from "@/components/ui/search-modal";

export function MobileBottomNav() {
    const pathname = usePathname();
    const [searchOpen, setSearchOpen] = useState(false);

    const navItems = [
        { icon: Home, label: "Home", href: "/" },
        { icon: Search, label: "Search", href: "#search", isSearch: true },
        { icon: Grid3X3, label: "Categories", href: "/categories" },
        { icon: ShoppingCart, label: "Cart", href: "/cart", },
        { icon: User, label: "Account", href: "/login" },
    ];

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map(item => {
                        const isActive = item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href));
                        if (item.isSearch) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setSearchOpen(true)}
                                    className="flex flex-col items-center justify-center  min-w-[4rem] relative"
                                    aria-label="Open search"
                                >
                                    <div className={`h-5 w-5 rounded-lg flex items-center justify-center  transition-colors ${isActive ? 'bg-[#1877F2] text-white' : 'text-gray-400'}`}>
                                        <Search className="h-5 w-5" />
                                    </div>
                                    <span className={`text-[10px] font-medium ${isActive ? 'text-[#1877F2]' : 'text-gray-400'}`}>{item.label}</span>
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
                               
                            </Link>
                        );
                    })}
                </div>
            </nav>
            {/* Spacer for bottom nav */}
            <div className="md:hidden h-16" />
            <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}

