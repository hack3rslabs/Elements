const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    let sessionId = localStorage.getItem('elements_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('elements_session_id', sessionId);
    }
    return sessionId;
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-session-id': getSessionId(),
        ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
}

// Products
export const getProducts = (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/products${query}`);
};

export const getProduct = (slug: string) => apiFetch(`/products/${slug}`);

// Categories
export const getCategories = () => apiFetch('/categories');
export const getCategory = (slug: string) => apiFetch(`/categories/${slug}`);

// Hero Slides
export const getHeroSlides = () => apiFetch('/heroslides');


// Search
export const searchProducts = (q: string) => apiFetch(`/search?q=${encodeURIComponent(q)}`);

// Cart
export const getCart = () => apiFetch('/cart');
export const addToCart = (productId: string, quantity = 1) =>
    apiFetch('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
export const updateCartItem = (productId: string, quantity: number) =>
    apiFetch(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
export const removeFromCart = (productId: string) =>
    apiFetch(`/cart/${productId}`, { method: 'DELETE' });

// Wishlist
export const getWishlist = () => apiFetch('/wishlist');
export const addToWishlist = (productId: string) =>
    apiFetch('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) });
export const removeFromWishlist = (productId: string) =>
    apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });

// Orders
export const createOrder = (shippingAddress: object, paymentMethod = 'COD') =>
    apiFetch('/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethod }) });
export const getOrders = () => apiFetch('/orders');
export const getOrder = (id: string) => apiFetch(`/orders/${id}`);

// Reviews
export const getReviews = (productId: string) => apiFetch(`/reviews/${productId}`);
export const submitReview = (productId: string, rating: number, comment: string, userName: string) =>
    apiFetch('/reviews', { method: 'POST', body: JSON.stringify({ productId, rating, comment, userName }) });

// Newsletter
export const subscribeNewsletter = (email: string) =>
    apiFetch('/newsletter', { method: 'POST', body: JSON.stringify({ email }) });

// Contact
export const submitContact = (data: { name: string; email: string; phone?: string; message: string; type?: string }) =>
    apiFetch('/contact', { method: 'POST', body: JSON.stringify(data) });

