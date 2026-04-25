"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface CartItem {
    productId: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        mrp: number;
        image: string;
        stockStatus: string;
        stock: number;
    };
}

interface CartState {
    items: CartItem[];
    subtotal: number;
    mrpTotal: number;
    savings: number;
    itemCount: number;
}

interface StoreContextType {
    cart: CartState;
    wishlist: string[];
    cartLoading: boolean;
    refreshCart: () => Promise<void>;
    addToCart: (productId: string, quantity?: number) => Promise<void>;
    updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    toast: { message: string; type: 'success' | 'error' } | null;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartState>({ items: [], subtotal: 0, mrpTotal: 0, savings: 0, itemCount: 0 });
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [cartLoading, setCartLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

    const refreshCart = useCallback(async () => {
        try {
            const data = await apiCall('/cart');
            if (data.success) setCart(data.data);
        } catch { /* silent */ }
    }, [apiCall]);

    const addToCartFn = useCallback(async (productId: string, quantity = 1) => {
        setCartLoading(true);
        try {
            const data = await apiCall('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
            if (data.success) {
                await refreshCart();
                showToast('Added to cart!');
            }
        } catch { showToast('Failed to add to cart', 'error'); }
        setCartLoading(false);
    }, [apiCall, refreshCart, showToast]);

    const updateCartQuantity = useCallback(async (productId: string, quantity: number) => {
        try {
            await apiCall(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
            await refreshCart();
        } catch { showToast('Failed to update cart', 'error'); }
    }, [apiCall, refreshCart, showToast]);

    const removeFromCartFn = useCallback(async (productId: string) => {
        try {
            await apiCall(`/cart/${productId}`, { method: 'DELETE' });
            await refreshCart();
            showToast('Removed from cart');
        } catch { showToast('Failed to remove item', 'error'); }
    }, [apiCall, refreshCart, showToast]);

    const toggleWishlist = useCallback(async (productId: string) => {
        try {
            if (wishlist.includes(productId)) {
                await apiCall(`/wishlist/${productId}`, { method: 'DELETE' });
                setWishlist(prev => prev.filter(id => id !== productId));
                showToast('Removed from wishlist');
            } else {
                await apiCall('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) });
                setWishlist(prev => [...prev, productId]);
                showToast('Added to wishlist! ❤️');
            }
        } catch { showToast('Failed to update wishlist', 'error'); }
    }, [wishlist, apiCall, showToast]);

    const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

    useEffect(() => {
        let mounted = true;
        const loadInitialData = async () => {
            try {
                await refreshCart();
                const data = await apiCall('/wishlist');
                if (mounted && data.success) {
                    setWishlist(data.data.map((p: { id: string }) => p.id));
                }
            } catch { /* silent */ }
        };
        loadInitialData();
        return () => { mounted = false; };
    }, [refreshCart, apiCall]);

    return (
        <StoreContext.Provider value={{
            cart, wishlist, cartLoading,
            refreshCart, addToCart: addToCartFn, updateCartQuantity,
            removeFromCart: removeFromCartFn, toggleWishlist, isInWishlist, toast
        }}>
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

