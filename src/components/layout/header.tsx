"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Heart, User, Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export function Header() {
    const { data: session, status } = useSession();
    const { cart, wishlist } = useStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ name: string; slug: string; price: number; image: string }[]>([]);
    const [scrolled, setScrolled] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let mounted = true;
        if (searchQuery.length < 2) {
            setTimeout(() => {
                if (mounted) setSearchResults([]);
            }, 0);
            return () => { mounted = false; };
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (mounted && data.success) setSearchResults(data.data.products.slice(0, 5));
            } catch { /* silent */ }
        }, 300);
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    const navCategories: { name: string; href: string; children?: { name: string; href: string }[] }[] = [
        // {
        //     name: "Kitchen Sinks", href: "/", children: [
        //         { name: "Quartz Sinks", href: "/category/quartz-sinks" },
        //         { name: "Handmade Sinks", href: "/category/handmade-sinks" },
        //         { name: "Multi Functional Sinks", href: "/category/multi-functional-sinks" },
        //     ]
        // },
        // {
        //     name: "Manhole Covers", href: "/", children: [
        //         { name: "Commercial Metrocover", href: "/category/comercial" },
        //         { name: "Domestic Truecover", href: "/category/domestic" },
        //     ]
        // },
        // {
        //     name: "Elevation", href: "/category/terracota-products", children: [
        //         { name: "Mitti Magic", href: "/category/terracota-products" },
        //         { name: "Exterior Cladding", href: "/category/terracota-products" },
        //     ]
        // },
    ];

    return (
        <>
            {/* Top Bar */}
            <div className="hidden md:block bg-[#0d47a1] text-white text-xs">
                <div className="container flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-semibold text-[10px] tracking-wide">
                            ⭐ 15+ Years of Trust
                        </span>
                        <a href="tel:+919995552252" className="flex items-center gap-1 hover:text-blue-200 transition-colors">
                            <Phone className="h-3 w-3" /> +91 9995552252
                        </a>
                        <a href="mailto:skceramics999@gmail.com" className="flex items-center gap-1 hover:text-blue-200 transition-colors">
                            <Mail className="h-3 w-3" /> skceramics999@gmail.com
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg' : 'bg-white'
                }`}>
                <div className="container flex h-16 items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    {/* Logo */}
                    <Link className="flex items-center gap-2 shrink-0" href="/">
                        <Image
                            src="/images/brand/elements-logo.png"
                            alt="Elements - World Class Elements"
                            width={160}
                            height={48}
                            className="h-11 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 ml-6">
                        {navCategories.map((cat) => (
                            <div key={cat.name} className="group relative">
                                <Link
                                    href={cat.href}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-[#1877F2] transition-colors rounded-lg hover:bg-accent"
                                >
                                    {cat.name}
                                    <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </Link>
                                {/* Dropdown */}
                                <div className="absolute left-0 top-full pt-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out z-50">
                                    <div className="bg-white rounded-xl shadow-xl border p-2 min-w-[200px]">
                                        {cat.children?.map((child) => (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-[#1877F2] hover:bg-accent rounded-lg transition-colors"
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Search + Icons */}
                    <div className="flex flex-1 items-center justify-end gap-2">
                        {/* Search */}
                        <div ref={searchRef} className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search sinks, tiles, flooring..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                                onFocus={() => setSearchOpen(true)}
                                className="w-full h-10 rounded-full border border-input bg-muted/30 px-4 pl-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] transition-all"
                            />
                            {/* Search Dropdown */}
                            {searchOpen && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border p-2 z-50 animate-fade-up" style={{ animationDuration: '0.25s' }}>
                                    {searchResults.map((p) => (
                                        <Link
                                            key={p.slug}
                                            href={`/product/${p.slug}`}
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                                            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                                        >
                                            <div className="h-10 w-10 bg-muted rounded-lg overflow-hidden shrink-0 relative">
                                                <Image src={p.image} alt={p.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{p.name}</p>
                                                <p className="text-xs text-[#1877F2] font-semibold">₹{p.price?.toLocaleString('en-IN')}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Icons */}
                        <Link 
                            href="/wishlist"
                            className="relative flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-[#1877F2] transition-colors"
                        >
                            <Heart className="h-5 w-5" />
                            {wishlist.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold shadow-md animate-scale-in">
                                    {wishlist.length}
                                </span>
                            )}
                        </Link>
                        
                        <Link 
                            href="/cart"
                            className="relative flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-[#1877F2] transition-colors"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cart.itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold shadow-md animate-scale-in">
                                    {cart.itemCount}
                                </span>
                            )}
                        </Link>
                        {status === "authenticated" ? (
                            <div className="flex items-center gap-2">
                                <Link 
                                    href={session?.user?.role === "ADMIN" || session?.user?.role === "STAFF" ? "/admin" : "/profile"}
                                    title="Account"
                                    className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-[#1877F2] transition-colors"
                                >
                                    <User className="h-5 w-5" />
                                </Link>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 hidden md:flex"
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <Link 
                                href="/login"
                                className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-[#1877F2] transition-colors"
                            >
                                <User className="h-5 w-5" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t bg-white animate-fade-down shadow-xl absolute w-full top-full" style={{ animationDuration: '0.3s' }}>
                        <nav className="container py-4 space-y-1">
                            {navCategories.map((cat) => (
                                <div key={cat.name}>
                                    <Link
                                        href={cat.href}
                                        className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent rounded-lg"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                    {cat.children?.map((child) => (
                                        <Link
                                            key={child.name}
                                            href={child.href}
                                            className="block px-8 py-2 text-sm text-muted-foreground hover:text-[#1877F2] hover:bg-accent rounded-lg"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                            <div className="border-t pt-3 mt-3 flex flex-col gap-2 px-4 shadow-sm pb-2">
                                {status === "authenticated" ? (
                                    <>
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <div className="flex flex-col">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Account</p>
                                                <p className="text-sm font-medium text-gray-900">{session?.user?.name || session?.user?.phone}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="text-xs font-bold text-red-500">Logout</Button>
                                        </div>
                                        <Link href={session?.user?.role === "ADMIN" || session?.user?.role === "STAFF" ? "/admin" : "/profile"} onClick={() => setMobileOpen(false)}>
                                            <Button className="w-full bg-[#1877F2] hover:bg-[#0d47a1]">Go to Dashboard</Button>
                                        </Link>
                                    </>
                                ) : (
                                    <Link href="/login" className="w-full" onClick={() => setMobileOpen(false)}>
                                        <Button className="w-full bg-[#1877F2] hover:bg-[#0d47a1]">Login / Register</Button>
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Mobile Bottom Navigation Formatted */}
            {/* <div className="md:hidden bg-white border-t px-2 py-2 flex items-center justify-around shadow-sm">
                <Link href="/" className="flex flex-col items-center p-2 text-gray-500 hover:text-[#1877F2] min-w-[64px]">
                    <div className="h-5 w-5 mb-1"><Home className="w-full h-full" /></div>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <button onClick={() => setMobileOpen(!mobileOpen)} className="flex flex-col items-center p-2 text-gray-500 hover:text-[#1877F2] min-w-[64px]">
                    <div className="h-5 w-5 mb-1"><Menu className="w-full h-full" /></div>
                    <span className="text-[10px] font-medium">Categories</span>
                </button>
                <Link href="/wishlist" className="flex flex-col items-center p-2 text-gray-500 hover:text-[#1877F2] min-w-[64px] relative">
                    <div className="h-5 w-5 mb-1"><Heart className="w-full h-full" /></div>
                    <span className="text-[10px] font-medium">Wishlist</span>
                    {wishlist.length > 0 && (
                        <span className="absolute top-1 right-3 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                            {wishlist.length}
                        </span>
                    )}
                </Link>
                <Link href="/cart" className="flex flex-col items-center p-2 text-gray-500 hover:text-[#1877F2] min-w-[64px] relative">
                    <div className="h-5 w-5 mb-1"><ShoppingCart className="w-full h-full" /></div>
                    <span className="text-[10px] font-medium">Cart</span>
                    {cart.itemCount > 0 && (
                        <span className="absolute top-1 right-3 h-4 w-4 rounded-full bg-[#1877F2] text-white text-[9px] flex items-center justify-center font-bold">
                            {cart.itemCount}
                        </span>
                    )}
                </Link>
                <Link href="/login" className="flex flex-col items-center p-2 text-gray-500 hover:text-[#1877F2] min-w-[64px]">
                    <div className="h-5 w-5 mb-1"><User className="w-full h-full" /></div>
                    <span className="text-[10px] font-medium">Account</span>
                </Link>
            </div> */}

            {/* Overlay for mobile menu */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 top-[108px]"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}

