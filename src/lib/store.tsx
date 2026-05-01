"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';

interface CartItem {
    productId: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        mrp: number;
        image: string;
        slug: string;
        images?: string[];
    };
}

interface CartState {
    items: CartItem[];
    subtotal: number;
    mrpTotal: number;
    savings: number;
    itemCount: number;
}

interface WishlistProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    images: string[];
    categoryName?: string;
    stockStatus?: string;
}

interface StoreContextType {
    cart: CartState;
    wishlist: WishlistProduct[];
    wishlistIds: string[];
    cartLoading: boolean;
    isInitialized: boolean;
    refreshCart: () => Promise<void>;
    addToCart: (productId: string, quantity?: number) => Promise<void>;
    updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    toast: { message: string; type: 'success' | 'error' } | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
    // 1. Core State
    const [cart, setCart] = useState<CartState>({ items: [], subtotal: 0, mrpTotal: 0, savings: 0, itemCount: 0 });
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
    const [cartLoading, setCartLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // 2. Refs for absolute stability
    const initRef = useRef(false);
    const cartRef = useRef(cart);
    const wishlistRef = useRef(wishlist);

    // Sync refs (used for deep comparison without triggering re-renders)
    useEffect(() => { cartRef.current = cart; }, [cart]);
    useEffect(() => { wishlistRef.current = wishlist; }, [wishlist]);

    // 3. Derived State
    const wishlistIds = useMemo(() => wishlist.map(p => p.id), [wishlist]);

    // 4. Utility Functions
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const getSessionId = useCallback(() => {
        if (typeof window === 'undefined') return 'ssr';
        let sessionId = localStorage.getItem('elements_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('elements_session_id', sessionId);
        }
        return sessionId;
    }, []);

    const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-session-id': getSessionId(),
        };
        const res = await fetch(`/api${endpoint}`, { ...options, headers });
        return res.json();
    }, [getSessionId]);

    // 5. Action Handlers (Stable)
    const refreshCart = useCallback(async () => {
        try {
            const data = await apiCall('/cart');
            if (data.success) {
                const newStr = JSON.stringify(data.data);
                if (JSON.stringify(cartRef.current) !== newStr) {
                    setCart(data.data);
                }
            }
        } catch (e) { console.error("Refresh Cart Error", e); }
    }, [apiCall]);

    const refreshWishlist = useCallback(async () => {
        try {
            const data = await apiCall('/wishlist');
            if (data.success) {
                const newStr = JSON.stringify(data.data);
                if (JSON.stringify(wishlistRef.current) !== newStr) {
                    setWishlist(data.data);
                }
            }
        } catch (e) { console.error("Refresh Wishlist Error", e); }
    }, [apiCall]);

    const addToCartFn = useCallback(async (productId: string, quantity: number = 1) => {
        setCartLoading(true);
        try {
            const data = await apiCall('/cart', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity })
            });
            if (data.success) {
                await refreshCart();
                showToast("Added to cart");
            }
        } catch {
            showToast("Failed to add to cart", "error");
        } finally {
            setCartLoading(false);
        }
    }, [apiCall, refreshCart, showToast]);

    const updateCartQuantity = useCallback(async (productId: string, quantity: number) => {
        if (quantity < 1) return;
        try {
            const data = await apiCall(`/cart/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
            if (data.success) await refreshCart();
        } catch (e) { console.error("Update Qty Error", e); }
    }, [apiCall, refreshCart]);

    const removeFromCartFn = useCallback(async (productId: string) => {
        try {
            const data = await apiCall(`/cart/${productId}`, {
                method: 'DELETE'
            });
            if (data.success) {
                await refreshCart();
                showToast("Removed from cart");
            }
        } catch (e) { console.error("Remove Error", e); }
    }, [apiCall, refreshCart, showToast]);

    const toggleWishlist = useCallback(async (productId: string) => {
        try {
            const data = await apiCall('/wishlist', {
                method: 'POST',
                body: JSON.stringify({ productId })
            });
            if (data.success) {
                await refreshWishlist();
                showToast(data.message || "Updated wishlist");
            }
        } catch {
            showToast("Failed to update wishlist", "error");
        }
    }, [apiCall, refreshWishlist, showToast]);

    const isInWishlist = useCallback((productId: string) => wishlist.some(p => p.id === productId), [wishlist]);

    // 6. INITIALIZATION (The Core Fix)
    useEffect(() => {
        // Strict guard against double-initialization
        if (initRef.current) return;
        initRef.current = true;
        
        console.log("🛒 Store initialization started...");
        
        const init = async () => {
            // Step A: Immediate Local Recovery (Instant UI)
            const localCart = localStorage.getItem('elements_cart');
            const localWish = localStorage.getItem('elements_wishlist');
            
            if (localCart) {
                try { 
                    const parsed = JSON.parse(localCart);
                    setCart(parsed);
                    console.log("🛒 Cart recovered from local storage");
                } catch { /* skip */ }
            }
            
            if (localWish) {
                try { 
                    const parsed = JSON.parse(localWish);
                    setWishlist(parsed);
                    console.log("❤️ Wishlist recovered from local storage");
                } catch { /* skip */ }
            }

            // Step B: Single Network Sync
            try {
                // We use local variables here to avoid any dependency on external state
                let sid = localStorage.getItem('elements_session_id');
                if (!sid) {
                    sid = 'sess_' + Math.random().toString(36).substring(2, 15);
                    localStorage.setItem('elements_session_id', sid);
                }
                
                const headers = { 'x-session-id': sid };
                
                console.log("🌐 Syncing store with server...");
                const [cRes, wRes] = await Promise.all([
                    fetch('/api/cart', { headers }).then(r => r.json()),
                    fetch('/api/wishlist', { headers }).then(r => r.json())
                ]);

                if (cRes.success) {
                    const newStr = JSON.stringify(cRes.data);
                    if (JSON.stringify(cartRef.current) !== newStr) {
                        setCart(cRes.data);
                        console.log("🛒 Cart updated from server");
                    }
                }
                
                if (wRes.success) {
                    const newStr = JSON.stringify(wRes.data);
                    if (JSON.stringify(wishlistRef.current) !== newStr) {
                        setWishlist(wRes.data);
                        console.log("❤️ Wishlist updated from server");
                    }
                }
            } catch (e) {
                console.error("❌ Store Init Network Error", e);
            } finally {
                setIsInitialized(true);
                console.log("✅ Store initialization complete");
            }
        };

        init();
    }, []); // ABSOLUTELY ZERO DEPENDENCIES - Guaranteed to run once per page load

    // 7. LocalStorage Persistence
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('elements_cart', JSON.stringify(cart));
    }, [cart, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('elements_wishlist', JSON.stringify(wishlist));
    }, [wishlist, isInitialized]);

    // 8. Memoized Context
    const contextValue = useMemo(() => ({
        cart, wishlist, wishlistIds, cartLoading, isInitialized,
        refreshCart, addToCart: addToCartFn, updateCartQuantity,
        removeFromCart: removeFromCartFn, toggleWishlist, isInWishlist, toast
    }), [cart, wishlist, wishlistIds, cartLoading, isInitialized, refreshCart, addToCartFn, updateCartQuantity, removeFromCartFn, toggleWishlist, isInWishlist, toast]);

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl text-white font-medium text-sm transition-all animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
                    }`}>
                    {toast.message}
                </div>
            )}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within StoreProvider');
    return context;
}
