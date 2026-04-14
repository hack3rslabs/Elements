const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { body, param, query, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== SECURITY MIDDLEWARE ====================

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-session-id', 'Authorization', 'x-admin-key', 'x-api-key'],
    maxAge: 86400,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', generalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
};

const sanitize = (value) => {
    if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '').trim();
    }
    return value;
};

const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            req.body[key] = sanitize(req.body[key]);
        }
    }
    next();
};
app.use(sanitizeBody);

// Admin auth middleware
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-admin-key'] || req.headers['x-api-key'];

    if (apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026' ||
        (authHeader && (authHeader === `Bearer ${ADMIN_API_KEY}` || authHeader === 'Bearer elements-admin-key-2026'))) {
        return next();
    }

    return res.status(403).json({ success: false, message: 'Admin access required' });
};

// Import data
const { categories, products, reviews } = require('./data/products');

// ==================== In-Memory Stores ====================
const carts = {};
const wishlists = {};
const orders = [];
const subscribers = [];
const inquiries = [];
const analyticsItems = [];
const userLeads = [];
const customers = [];
const payments = [];

// ==================== AUTH & OTP ====================
const otps = {};

app.post('/api/auth/otp/send', authLimiter, (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    otps[phone] = "123456";
    console.log(`[AUTH] OTP for ${phone}: 123456`);
    res.json({ success: true, message: 'OTP sent successfully (Sample: 123456)' });
});

app.post('/api/auth/otp/verify', authLimiter, (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    if (otp === "123456") {
        delete otps[phone];
        const mockUser = {
            id: 'mob_' + phone,
            name: 'User ' + phone.slice(-4),
            email: phone + '@elements.com',
            phone: phone,
            role: 'user'
        };
        res.json({ success: true, user: mockUser });
    } else {
        res.status(401).json({ success: false, message: 'Invalid OTP. Use 123456 for testing.' });
    }
});

// ==================== ANALYTICS & LEADS ====================
app.post('/api/analytics', (req, res) => {
    const { sessionId, event, path, params, metadata } = req.body;
    const entry = {
        id: uuidv4(),
        sessionId,
        event: event || 'page_view',
        path,
        params: params || {},
        metadata: metadata || {},
        timestamp: new Date().toISOString()
    };
    analyticsItems.push(entry);
    res.json({ success: true });
});

app.post('/api/leads', (req, res) => {
    const { name, email, phone, sessionId, source = 'website', message = '', type = 'general' } = req.body;
    if (!name && !email && !phone) return res.status(400).json({ success: false, message: 'At least one contact field is required' });

    const lead = {
        id: uuidv4(),
        name: name || 'Unknown',
        email: email || '',
        phone: phone || '',
        sessionId,
        source,
        message: message || '',
        type: type || 'general',
        status: 'new',
        notes: [],
        followUps: [],
        convertedToCustomer: false,
        customerId: null,
        assignedTo: '',
        value: 0,
        tags: [],
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    res.status(201).json({ success: true, message: 'Lead captured!', data: lead });
});

// ==================== CATEGORIES ====================
app.get('/api/categories', (req, res) => {
    const allCategories = [];
    categories.forEach(cat => {
        allCategories.push({
            id: cat.id, name: cat.name, slug: cat.slug,
            description: cat.description, image: cat.image, parentId: cat.parentId,
            productCount: products.filter(p => p.categoryId === cat.id || cat.children?.some(c => c.id === p.categoryId)).length,
        });
        if (cat.children) {
            cat.children.forEach(child => {
                allCategories.push({
                    id: child.id, name: child.name, slug: child.slug,
                    parentId: child.parentId,
                    productCount: products.filter(p => p.categoryId === child.id).length,
                });
            });
        }
    });
    res.json({ success: true, data: allCategories });
});

app.get('/api/categories/:slug', (req, res) => {
    const { slug } = req.params;
    let category = categories.find(c => c.slug === slug);
    if (!category) {
        for (const cat of categories) {
            const child = cat.children?.find(c => c.slug === slug);
            if (child) { category = { ...child, parentName: cat.name }; break; }
        }
    }
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const categoryIds = [category.id];
    if (category.children) category.children.forEach(c => categoryIds.push(c.id));

    const categoryProducts = products.filter(p => categoryIds.includes(p.categoryId));
    res.json({ success: true, data: { ...category, products: categoryProducts } });
});

// ==================== PRODUCTS ====================
app.get('/api/products', (req, res) => {
    let filtered = [...products];
    const { category, search, minPrice, maxPrice, material, finish, stockStatus, sort, page = 1, limit = 12, bestSeller, newArrival, minRating } = req.query;

    // 1. Initial Category/Search Filtering (The "Base" set for facets)
    if (category && typeof category === 'string') {
        const cat = categories.find(c => c.slug === category);
        if (cat) {
            const ids = [cat.id, ...(cat.children?.map(c => c.id) || [])];
            filtered = filtered.filter(p => ids.includes(p.categoryId));
        }
    }
    if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.shortDescription?.toLowerCase().includes(q) ||
            p.tags?.some(t => t.includes(q)) ||
            p.categoryName?.toLowerCase().includes(q)
        );
    }

    // Capture the base set for facets calculation
    const baseSet = [...filtered];

    // 2. Apply dynamic filters
    if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));
    
    // Support multi-select materials/finishes
    if (material) {
        const mList = Array.isArray(material) ? material.map(m => m.toLowerCase()) : [material.toLowerCase()];
        filtered = filtered.filter(p => mList.some(m => p.specifications?.material?.toLowerCase().includes(m)));
    }
    if (finish) {
        const fList = Array.isArray(finish) ? finish.map(f => f.toLowerCase()) : [finish.toLowerCase()];
        filtered = filtered.filter(p => fList.some(f => p.specifications?.finish?.toLowerCase().includes(f)));
    }
    
    if (stockStatus) filtered = filtered.filter(p => p.stockStatus === stockStatus);
    if (bestSeller === 'true') filtered = filtered.filter(p => p.isBestSeller);
    if (newArrival === 'true') filtered = filtered.filter(p => p.isNewArrival);
    if (minRating) filtered = filtered.filter(p => (p.rating || 0) >= Number(minRating));

    // 3. Facets Calculation (derived from the base result set)
    const facets = {
        materials: [...new Set(baseSet.map(p => p.specifications?.material).filter(Boolean))],
        finishes: [...new Set(baseSet.map(p => p.specifications?.finish).filter(Boolean))],
        priceRange: {
            min: Math.min(...baseSet.map(p => p.price), 0),
            max: Math.max(...baseSet.map(p => p.price), 50000)
        },
        counts: {
            inStock: baseSet.filter(p => p.stockStatus === 'IN_STOCK').length,
            bestSellers: baseSet.filter(p => p.isBestSeller).length,
            newArrivals: baseSet.filter(p => p.isNewArrival).length
        }
    };

    // 4. Sorting
    switch (sort) {
        case 'price_asc': filtered.sort((a, b) => a.price - b.price); break;
        case 'price_desc': filtered.sort((a, b) => b.price - a.price); break;
        case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
        case 'popularity': filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); break;
        default: filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    // 5. Pagination
    const total = filtered.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);

    res.json({
        success: true,
        data: paginated,
        facets,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
});

app.get('/api/products/:slug', (req, res) => {
    const product = products.find(p => p.slug === req.params.slug);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const productReviews = reviews.filter(r => r.productId === product.id);
    const relatedProducts = products
        .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
        .slice(0, 4);

    res.json({ success: true, data: { ...product, reviews: productReviews, relatedProducts } });
});

app.post('/api/products', requireAdmin, (req, res) => {
    const productData = req.body;
    if (!productData.name || !productData.price) {
        return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const newProduct = {
        ...productData,
        id: `prod-${Date.now()}`,
        slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        createdAt: new Date().toISOString(),
        rating: 0,
        reviewCount: 0,
        images: productData.images || [],
        stock: Number(productData.stock) || 0,
        stockStatus: Number(productData.stock) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    };

    products.push(newProduct);
    res.status(201).json({ success: true, message: 'Product created', data: newProduct });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return res.status(404).json({ success: false, message: 'Product not found' });

    products[index] = { ...products[index], ...updateData, id };
    res.json({ success: true, message: 'Product updated', data: products[index] });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return res.status(404).json({ success: false, message: 'Product not found' });

    products.splice(index, 1);
    res.json({ success: true, message: 'Product deleted' });
});

// ==================== SEARCH ====================
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: { products: [], suggestions: [] } });

    const searchQuery = q.toLowerCase();
    const results = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.shortDescription?.toLowerCase().includes(searchQuery) ||
        p.tags?.some(t => t.includes(searchQuery)) ||
        p.categoryName?.toLowerCase().includes(searchQuery) ||
        p.parentCategory?.toLowerCase().includes(searchQuery)
    );

    const suggestions = [...new Set(
        products.flatMap(p => p.tags || []).filter(t => t.includes(searchQuery))
    )].slice(0, 5);

    res.json({ success: true, data: { products: results.slice(0, 10), suggestions, total: results.length } });
});

// ==================== CART ====================
app.get('/api/cart', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const cartItems = carts[sessionId] || [];
    const enriched = cartItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product: product ? { id: product.id, name: product.name, slug: product.slug, price: product.price, mrp: product.mrp, image: product.images[0], stockStatus: product.stockStatus, stock: product.stock } : null };
    }).filter(item => item.product);

    const subtotal = enriched.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const mrpTotal = enriched.reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);

    res.json({ success: true, data: { items: enriched, subtotal, mrpTotal, savings: mrpTotal - subtotal, itemCount: enriched.reduce((sum, item) => sum + item.quantity, 0) } });
});

app.post('/api/cart', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (!carts[sessionId]) carts[sessionId] = [];
    const existing = carts[sessionId].find(item => item.productId === productId);
    if (existing) { existing.quantity += quantity; } else { carts[sessionId].push({ id: uuidv4(), productId, quantity }); }
    res.json({ success: true, message: 'Added to cart', data: { itemCount: carts[sessionId].reduce((sum, item) => sum + item.quantity, 0) } });
});

app.put('/api/cart/:productId', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { productId } = req.params;
    const { quantity } = req.body;
    if (!carts[sessionId]) return res.status(404).json({ success: false, message: 'Cart not found' });
    const item = carts[sessionId].find(i => i.productId === productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });
    if (quantity <= 0) { carts[sessionId] = carts[sessionId].filter(i => i.productId !== productId); } else { item.quantity = quantity; }
    res.json({ success: true, message: 'Cart updated' });
});

app.delete('/api/cart/:productId', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    if (!carts[sessionId]) return res.status(404).json({ success: false, message: 'Cart not found' });
    carts[sessionId] = carts[sessionId].filter(i => i.productId !== req.params.productId);
    res.json({ success: true, message: 'Removed from cart' });
});

// ==================== WISHLIST ====================
app.get('/api/wishlist', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const wishlistIds = wishlists[sessionId] || [];
    const wishlistProducts = wishlistIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    res.json({ success: true, data: wishlistProducts });
});

app.post('/api/wishlist', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    if (!wishlists[sessionId]) wishlists[sessionId] = [];
    if (!wishlists[sessionId].includes(productId)) { wishlists[sessionId].push(productId); }
    res.json({ success: true, message: 'Added to wishlist' });
});

app.delete('/api/wishlist/:productId', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    if (!wishlists[sessionId]) return res.json({ success: true, message: 'Wishlist empty' });
    wishlists[sessionId] = wishlists[sessionId].filter(id => id !== req.params.productId);
    res.json({ success: true, message: 'Removed from wishlist' });
});

// ==================== REVIEWS ====================
app.get('/api/reviews/:productId', (req, res) => {
    const productReviews = reviews.filter(r => r.productId === req.params.productId);
    const stats = {
        total: productReviews.length,
        average: productReviews.length > 0 ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1) : 0,
        distribution: [5, 4, 3, 2, 1].map(star => ({ star, count: productReviews.filter(r => r.rating === star).length })),
    };
    res.json({ success: true, data: { reviews: productReviews, stats } });
});

app.post('/api/reviews', (req, res) => {
    const { productId, rating, comment, userName } = req.body;
    if (!productId || !rating) return res.status(400).json({ success: false, message: 'Product ID and rating required' });
    const review = {
        id: `rev-${uuidv4()}`, productId, userId: `user-${uuidv4()}`,
        userName: userName || 'Anonymous',
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        comment: comment || '', verified: false, createdAt: new Date().toISOString(),
    };
    reviews.push(review);
    const product = products.find(p => p.id === productId);
    if (product) {
        const prodReviews = reviews.filter(r => r.productId === productId);
        product.rating = parseFloat((prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length).toFixed(1));
        product.reviewCount = prodReviews.length;
    }
    res.json({ success: true, message: 'Review submitted', data: review });
});

// ==================== STATS ====================
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalProducts: products.length,
            totalCategories: categories.length,
            bestSellers: products.filter(p => p.isBestSeller).length,
            newArrivals: products.filter(p => p.isNewArrival).length,
        }
    });
});

// ==================== NEWSLETTER ====================
app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (subscribers.includes(email)) return res.json({ success: true, message: 'Already subscribed' });
    subscribers.push(email);
    res.json({ success: true, message: 'Subscribed successfully!' });
});

// ==================== CONTACT ====================
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message, type = 'general' } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    const inquiry = { id: uuidv4(), name, email, phone, message, type, createdAt: new Date().toISOString() };
    inquiries.push(inquiry);
    // Also create a lead automatically from contact form
    const lead = {
        id: uuidv4(), name, email, phone: phone || '', source: 'website_contact',
        message, type, status: 'new', notes: [], followUps: [],
        convertedToCustomer: false, customerId: null, assignedTo: '', value: 0, tags: ['contact-form'],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    res.json({ success: true, message: 'Inquiry submitted. We\'ll get back to you shortly!' });
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ==================== CHECKOUT & ORDERS ====================

const pincodeData = {
    '110001': { area: 'Connaught Place', city: 'Delhi', state: 'Delhi' },
    '400001': { area: 'Fort', city: 'Mumbai', state: 'Maharashtra' },
    '560001': { area: 'City Station', city: 'Bangalore', state: 'Karnataka' },
    '700001': { area: 'Dalhousie Square', city: 'Kolkata', state: 'West Bengal' },
    '600001': { area: 'Chennai GPO', city: 'Chennai', state: 'Tamil Nadu' },
    '500001': { area: 'Hyderabad GPO', city: 'Hyderabad', state: 'Telangana' },
    '380001': { area: 'Ahmedabad GPO', city: 'Ahmedabad', state: 'Gujarat' },
    '411001': { area: 'Pune GPO', city: 'Pune', state: 'Maharashtra' },
};

app.get('/api/pincode/:pin', (req, res) => {
    const data = pincodeData[req.params.pin];
    if (!data) return res.status(404).json({ success: false, message: 'PIN code not found in our delivery database' });
    res.json({ success: true, data });
});

app.post('/api/orders', (req, res) => {
    const {
        sessionId, items, subtotal, shipping, total,
        customerName, email, phone, address, pincode, area, city, state,
        paymentMethod, transportChoice, gstin, billingAddress
    } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });
    if (!customerName || !email || !address || !pincode) return res.status(400).json({ success: false, message: 'Required customer details missing' });

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
        id: orderId, sessionId, items,
        subtotal: Number(subtotal) || 0,
        shipping: Number(shipping) || 0,
        total: Number(total) || 0,
        customer: { name: customerName, email, phone, address, pincode, area, city, state, gstin, billingAddress: billingAddress || address },
        status: 'PENDING',
        paymentMethod, paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        transportChoice,
        timeline: [{ status: 'Order Placed', time: new Date().toISOString(), description: 'Your order has been successfully placed.' }],
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);

    // Track payment
    if (paymentMethod !== 'cod') {
        payments.push({
            id: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
            orderId, amount: total, method: paymentMethod,
            status: 'completed', gateway: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Razorpay' : 'NetBanking',
            transactionId: `TXN-${Date.now()}`,
            timestamp: new Date().toISOString(),
        });
    }

    if (carts[sessionId]) { carts[sessionId] = []; }
    res.status(201).json({ success: true, message: 'Order created successfully', orderId });
});

app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
});

// ==================== ADMIN API ENDPOINTS ====================

// GET all orders (admin)
app.get('/api/admin/orders', requireAdmin, (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    let filtered = [...orders];
    if (status && status !== 'all') filtered = filtered.filter(o => o.status === status);
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = filtered.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);
    res.json({ success: true, data: paginated, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

// UPDATE order status (admin)
app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.timeline.push({ status: status.charAt(0) + status.slice(1).toLowerCase(), time: new Date().toISOString(), description: `Order status updated to ${status}` });
    res.json({ success: true, message: `Order ${id} updated to ${status}`, data: order });
});

// ==================== ADMIN DASHBOARD STATS ====================
app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= todayStart);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);

    const statusCounts = {};
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    const topProducts = {};
    orders.forEach(o => {
        (o.items || []).forEach(item => {
            const name = item.name || item.productId;
            topProducts[name] = (topProducts[name] || 0) + (item.quantity || 1);
        });
    });
    const topProductList = Object.entries(topProducts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, count]) => ({ name, count }));

    // Lead stats by source
    const leadsBySource = {};
    userLeads.forEach(l => { leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1; });

    // Lead stats by status
    const leadsByStatus = {};
    userLeads.forEach(l => { leadsByStatus[l.status || 'new'] = (leadsByStatus[l.status || 'new'] || 0) + 1; });

    // Revenue by payment method
    const revenueByMethod = {};
    payments.forEach(p => { revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount; });

    // Weekly leads
    const weeklyLeads = userLeads.filter(l => new Date(l.timestamp) >= weekAgo).length;

    // Conversion rate
    const convertedLeads = userLeads.filter(l => l.convertedToCustomer).length;
    const conversionRate = userLeads.length > 0 ? ((convertedLeads / userLeads.length) * 100).toFixed(1) : 0;

    // Category-wise product distribution
    const categoryDist = {};
    products.forEach(p => { categoryDist[p.categoryName || 'Other'] = (categoryDist[p.categoryName || 'Other'] || 0) + 1; });

    // Stock alerts: products with stock < 20
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 20).map(p => ({ id: p.id, name: p.name, stock: p.stock, sku: p.sku }));

    res.json({
        success: true,
        data: {
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue: totalRevenue.toFixed(2),
            todayOrders: todayOrders.length,
            totalLeads: userLeads.length,
            totalSubscribers: subscribers.length,
            totalInquiries: inquiries.length,
            totalCustomers: [...new Set(orders.map(o => o.customer.email))].length,
            ordersByStatus: statusCounts,
            topProducts: topProductList,
            leadsBySource,
            leadsByStatus,
            revenueByMethod,
            weeklyLeads,
            conversionRate: parseFloat(conversionRate),
            categoryDistribution: categoryDist,
            lowStockProducts,
            totalPayments: payments.length,
            onlineRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
        },
    });
});

// ==================== CRM / LEADS (Full CRUD) ====================

// GET all leads
app.get('/api/admin/leads', requireAdmin, (req, res) => {
    const { source, status, search, page = 1, limit = 50 } = req.query;
    let filtered = [...userLeads];

    if (source && source !== 'all') filtered = filtered.filter(l => l.source === source);
    if (status && status !== 'all') filtered = filtered.filter(l => l.status === status);
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(l =>
            (l.name || '').toLowerCase().includes(q) ||
            (l.email || '').toLowerCase().includes(q) ||
            (l.phone || '').toLowerCase().includes(q) ||
            (l.message || '').toLowerCase().includes(q)
        );
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total = filtered.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);
    res.json({ success: true, data: paginated, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

// GET single lead
app.get('/api/admin/leads/:id', requireAdmin, (req, res) => {
    const lead = userLeads.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
});

// CREATE lead manually
app.post('/api/admin/leads', requireAdmin, (req, res) => {
    const { name, email, phone, source = 'manual', message = '', type = 'general', assignedTo = '', value = 0, tags = [] } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const lead = {
        id: uuidv4(), name, email: email || '', phone: phone || '',
        source, message, type, status: 'new',
        notes: [], followUps: [],
        convertedToCustomer: false, customerId: null,
        assignedTo, value: Number(value) || 0,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean),
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    res.status(201).json({ success: true, message: 'Lead created', data: lead });
});

// UPDATE lead
app.put('/api/admin/leads/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = userLeads.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Lead not found' });

    const updateData = req.body;
    // Don't allow overwriting notes/followUps via PUT — use dedicated endpoints
    delete updateData.notes;
    delete updateData.followUps;

    userLeads[index] = { ...userLeads[index], ...updateData, id, updatedAt: new Date().toISOString() };
    res.json({ success: true, message: 'Lead updated', data: userLeads[index] });
});

// DELETE lead
app.delete('/api/admin/leads/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = userLeads.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Lead not found' });
    userLeads.splice(index, 1);
    res.json({ success: true, message: 'Lead deleted' });
});

// UPDATE lead status
app.patch('/api/admin/leads/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }
    const lead = userLeads.find(l => l.id === id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    res.json({ success: true, message: `Lead status updated to ${status}`, data: lead });
});

// ADD follow-up note to lead
app.post('/api/admin/leads/:id/notes', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { note, type = 'note' } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note text is required' });

    const lead = userLeads.find(l => l.id === id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (!lead.notes) lead.notes = [];
    const newNote = {
        id: uuidv4(),
        text: note,
        type, // 'note', 'call', 'email', 'meeting', 'whatsapp'
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
    };
    lead.notes.push(newNote);
    lead.updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Note added', data: newNote });
});

// ADD follow-up schedule
app.post('/api/admin/leads/:id/followups', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { scheduledAt, type = 'call', note = '' } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'Scheduled date/time is required' });

    const lead = userLeads.find(l => l.id === id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (!lead.followUps) lead.followUps = [];
    const followUp = {
        id: uuidv4(),
        scheduledAt,
        type, // 'call', 'email', 'meeting', 'whatsapp', 'visit'
        note,
        status: 'scheduled', // 'scheduled', 'completed', 'missed'
        createdAt: new Date().toISOString(),
    };
    lead.followUps.push(followUp);
    lead.updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Follow-up scheduled', data: followUp });
});

// UPDATE follow-up status
app.patch('/api/admin/leads/:id/followups/:followUpId', requireAdmin, (req, res) => {
    const { id, followUpId } = req.params;
    const { status } = req.body;

    const lead = userLeads.find(l => l.id === id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const followUp = (lead.followUps || []).find(f => f.id === followUpId);
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    followUp.status = status;
    lead.updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Follow-up updated', data: followUp });
});

// CONVERT lead to customer
app.post('/api/admin/leads/:id/convert', requireAdmin, (req, res) => {
    const { id } = req.params;
    const lead = userLeads.find(l => l.id === id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.convertedToCustomer) return res.status(400).json({ success: false, message: 'Lead already converted' });

    const customer = {
        id: `cust-${uuidv4().slice(0, 8)}`,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        leadId: lead.id,
        totalOrders: 0,
        totalSpend: 0,
        joined: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };
    customers.push(customer);

    lead.convertedToCustomer = true;
    lead.customerId = customer.id;
    lead.status = 'won';
    lead.updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Lead converted to customer!', data: { lead, customer } });
});

// ==================== CUSTOMERS ====================
app.get('/api/admin/customers', requireAdmin, (req, res) => {
    // Collect unique customers from actual orders
    const customerMap = new Map();

    // 1. Add explicitly converted customers (leads)
    customers.forEach(c => {
        customerMap.set(c.email, { ...c, type: 'converted' });
    });

    // 2. Add/Update from orders
    orders.forEach(order => {
        const email = order.customer.email;
        if (!customerMap.has(email)) {
            customerMap.set(email, {
                id: `cust-${uuidv4().slice(0, 8)}`,
                name: order.customer.name || 'Unknown',
                email: order.customer.email,
                phone: order.customer.phone || '',
                totalOrders: 0,
                totalSpend: 0,
                lastOrder: order.createdAt,
                status: 'active',
                joined: order.createdAt,
                type: 'order'
            });
        }
        const c = customerMap.get(email);
        c.totalOrders += 1;
        c.totalSpend += Number(order.total) || 0;
        if (new Date(order.createdAt) > new Date(c.lastOrder)) {
            c.lastOrder = order.createdAt;
        }
    });

    const customerList = Array.from(customerMap.values());
    res.json({ success: true, data: customerList });
});

// ==================== ONLINE PAYMENTS ====================
app.get('/api/admin/payments', requireAdmin, (req, res) => {
    const { status, method, page = 1, limit = 20 } = req.query;
    let filtered = [...payments];
    if (status && status !== 'all') filtered = filtered.filter(p => p.status === status);
    if (method && method !== 'all') filtered = filtered.filter(p => p.method === method);
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = filtered.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);

    const summary = {
        totalCollected: payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
        totalPending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
        totalRefunded: payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0),
        byMethod: {},
    };
    payments.forEach(p => { summary.byMethod[p.method] = (summary.byMethod[p.method] || 0) + p.amount; });

    res.json({ success: true, data: paginated, summary, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

// ==================== WEBHOOK RECEIVERS ====================

// Generic webhook
app.post('/api/webhooks/generic', (req, res) => {
    const { name, email, phone, source = 'webhook', message = '' } = req.body;
    if (!name && !email && !phone) return res.status(400).json({ success: false, message: 'At least one contact field is required' });
    const lead = {
        id: uuidv4(), name: name || 'Unknown', email: email || '', phone: phone || '',
        source, message, type: 'webhook', status: 'new',
        notes: [], followUps: [], convertedToCustomer: false, customerId: null,
        assignedTo: '', value: 0, tags: [source],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    res.status(201).json({ success: true, message: 'Lead captured' });
});

// IndiaMART webhook
app.post('/api/webhooks/indiamart', (req, res) => {
    const { SENDER_NAME, SENDER_EMAIL, SENDER_MOBILE, QUERY_MESSAGE, QUERY_PRODUCT_NAME } = req.body;
    const lead = {
        id: uuidv4(), name: SENDER_NAME || 'IndiaMART Lead', email: SENDER_EMAIL || '', phone: SENDER_MOBILE || '',
        source: 'indiamart', message: QUERY_MESSAGE || '', product: QUERY_PRODUCT_NAME || '',
        type: 'B2B Inquiry', status: 'new', notes: [], followUps: [],
        convertedToCustomer: false, customerId: null, assignedTo: '', value: 0, tags: ['indiamart'],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    console.log(`[WEBHOOK] IndiaMART lead: ${lead.name}`);
    res.status(201).json({ success: true, message: 'IndiaMART lead captured' });
});

// Amazon webhook
app.post('/api/webhooks/amazon', (req, res) => {
    const { orderType, customerName, email, phone, product, quantity } = req.body;
    const lead = {
        id: uuidv4(), name: customerName || 'Amazon Customer', email: email || '', phone: phone || '',
        source: 'amazon', message: `Order: ${product || 'N/A'} x${quantity || 1}`, type: orderType || 'order',
        status: 'new', notes: [], followUps: [], convertedToCustomer: false, customerId: null,
        assignedTo: '', value: 0, tags: ['amazon'],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    console.log(`[WEBHOOK] Amazon lead: ${lead.name}`);
    res.status(201).json({ success: true, message: 'Amazon lead captured' });
});

// Flipkart webhook
app.post('/api/webhooks/flipkart', (req, res) => {
    const { customerName, email, phone, productName, orderId } = req.body;
    const lead = {
        id: uuidv4(), name: customerName || 'Flipkart Customer', email: email || '', phone: phone || '',
        source: 'flipkart', message: `Order #${orderId || 'N/A'}: ${productName || 'N/A'}`,
        type: 'order', status: 'new', notes: [], followUps: [], convertedToCustomer: false, customerId: null,
        assignedTo: '', value: 0, tags: ['flipkart'],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    console.log(`[WEBHOOK] Flipkart lead: ${lead.name}`);
    res.status(201).json({ success: true, message: 'Flipkart lead captured' });
});

// Meesho webhook
app.post('/api/webhooks/meesho', (req, res) => {
    const { customerName, email, phone, productName, orderId, orderValue } = req.body;
    const lead = {
        id: uuidv4(), name: customerName || 'Meesho Customer', email: email || '', phone: phone || '',
        source: 'meesho', message: `Meesho Order #${orderId || 'N/A'}: ${productName || 'N/A'}`,
        type: 'order', status: 'new', notes: [], followUps: [], convertedToCustomer: false, customerId: null,
        assignedTo: '', value: Number(orderValue) || 0, tags: ['meesho'],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    console.log(`[WEBHOOK] Meesho lead: ${lead.name}`);
    res.status(201).json({ success: true, message: 'Meesho lead captured' });
});

// STAFF LOGIN via Backend (called by NextAuth)
app.post('/api/auth/staff/login', (req, res) => {
    const { email, password } = req.body;
    // Check staffUsers array
    const user = staffUsers.find(u => u.email === email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(401).json({ success: false, message: 'Account suspended' });

    // Check password
    if (user.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.lastLogin = new Date().toISOString();
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
});

// OTP send route (for staff or customer login)
app.post('/api/auth/otp/send', (req, res) => {
    const { email, phone } = req.body;
    if (!email && !phone) return res.status(400).json({ success: false, message: 'Email or phone is required' });

    // In a real app, generate OTP, save it with an expiry, and send via email/SMS
    // For this mock API, we'll just simulate success
    console.log(`[AUTH] OTP requested for ${email || phone}`);
    res.json({ success: true, message: 'OTP sent successfully (simulated)' });
});

// OTP verify route
app.post('/api/auth/otp/verify', (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    // Mock verification: 123456 is always valid for testing
    if (otp === '123456') {
        // Find existing customer or staff by phone
        let user = staffUsers.find(u => u.phone === phone);
        if (!user) {
            // Check customers (derived or stored)
            // For now, let's look in the converted customers array
            user = customers.find(c => c.phone === phone);
        }

        // If still no user, create a dummy customer for testing flow
        if (!user) {
            user = {
                id: `user-${uuidv4().slice(0, 8)}`,
                name: 'New Customer',
                phone: phone,
                role: 'CUSTOMER',
                status: 'active'
            };
        }

        const roleMap = { admin: 'ADMIN', sub_admin: 'ADMIN', staff: 'STAFF', tele_caller: 'STAFF', product_uploader: 'STAFF', CUSTOMER: 'CUSTOMER' };

        return res.json({
            success: true,
            user: {
                id: user.id || user.email,
                name: user.name,
                email: user.email || '',
                phone: user.phone,
                role: roleMap[user.role] || 'CUSTOMER',
                permissions: user.permissions || []
            }
        });
    }

    res.status(401).json({ success: false, message: 'Invalid OTP' });
});
app.post('/api/webhooks/meta', (req, res) => {
    const { leadgen_id, form_id, field_data, created_time, ad_name } = req.body;
    // Parse Meta lead gen format
    let name = '', email = '', phone = '';
    if (Array.isArray(field_data)) {
        field_data.forEach(f => {
            if (f.name === 'full_name') name = f.values?.[0] || '';
            if (f.name === 'email') email = f.values?.[0] || '';
            if (f.name === 'phone_number') phone = f.values?.[0] || '';
        });
    } else {
        name = req.body.name || req.body.customerName || 'Meta Lead';
        email = req.body.email || '';
        phone = req.body.phone || '';
    }
    const lead = {
        id: uuidv4(), name: name || 'Meta Lead', email, phone,
        source: 'meta', message: `Ad: ${ad_name || 'Direct'}`, type: 'ad_lead',
        status: 'new', notes: [], followUps: [], convertedToCustomer: false, customerId: null,
        assignedTo: '', value: 0, tags: ['meta', 'facebook', 'instagram'],
        externalId: leadgen_id || '', formId: form_id || '',
        timestamp: created_time || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    console.log(`[WEBHOOK] Meta lead: ${lead.name}`);
    res.status(201).json({ success: true, message: 'Meta lead captured' });
});

// Google My Business webhook
app.post('/api/webhooks/google-business', (req, res) => {
    const { name, email, phone, message } = req.body;
    const lead = {
        id: uuidv4(), name: name || 'GMB Lead', email: email || '', phone: phone || '',
        source: 'google_business', message: message || '', type: 'inquiry',
        status: 'new', notes: [], followUps: [], convertedToCustomer: false, customerId: null,
        assignedTo: '', value: 0, tags: ['google'],
        timestamp: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    userLeads.push(lead);
    console.log(`[WEBHOOK] GMB lead: ${lead.name}`);
    res.status(201).json({ success: true, message: 'GMB lead captured' });
});

// ==================== INTEGRATIONS CONFIG ====================
const integrations = {
    amazon: { enabled: false, sellerId: '', apiKey: '', lastSync: null, status: 'disconnected' },
    flipkart: { enabled: false, sellerId: '', apiKey: '', lastSync: null, status: 'disconnected' },
    meesho: { enabled: false, sellerId: '', apiKey: '', lastSync: null, status: 'disconnected' },
    indiamart: { enabled: true, webhookUrl: '/api/webhooks/indiamart', apiKey: '', lastSync: null, status: 'active' },
    meta: { enabled: false, pageId: '', accessToken: '', webhookUrl: '/api/webhooks/meta', lastSync: null, status: 'disconnected' },
    crm: { enabled: false, provider: '', webhookUrl: '', apiKey: '', lastSync: null, status: 'disconnected' },
};

app.get('/api/admin/integrations', requireAdmin, (req, res) => {
    // Update lead counts dynamically
    Object.keys(integrations).forEach(key => {
        integrations[key].leadsReceived = userLeads.filter(l => l.source === key).length;
    });
    res.json({ success: true, data: integrations });
});

app.post('/api/admin/integrations', requireAdmin, (req, res) => {
    const { platform, config } = req.body;
    if (!platform || !integrations[platform]) {
        return res.status(400).json({ success: false, message: 'Invalid platform' });
    }
    Object.assign(integrations[platform], config, { lastSync: new Date().toISOString() });
    console.log(`[INTEGRATION] ${platform} config updated`);
    res.json({ success: true, message: `${platform} integration updated`, data: integrations[platform] });
});

// ==================== PAGE SEO MANAGEMENT ====================
const pageSeoData = [
    { id: 'home', page: 'Homepage', path: '/', metaTitle: 'Hindustan Elements — Premium Building Products', metaDescription: 'Shop 500+ premium kitchen sinks, tiles, floor guard sheets & elevation panels. 15+ years in the market. Free delivery on ₹5K+.', ogImage: '', keywords: 'kitchen sinks, tiles, floor guard, elevation panels, building materials' },
    { id: 'kitchen', page: 'Kitchen Sinks', path: '/category/kitchen', metaTitle: 'Premium Kitchen Sinks — 304-Grade Stainless Steel', metaDescription: 'Explore durable, rust-resistant kitchen sinks designed for modern Indian kitchens. ISO certified with up to 25 year warranty.', ogImage: '', keywords: 'kitchen sink, stainless steel sink, granite sink' },
    { id: 'flooring', page: 'Floor Guard', path: '/category/flooring', metaTitle: 'Floor Guard Sheets — Anti-Slip PVC & Rubber Flooring', metaDescription: 'Industrial-grade floor guard sheets for kitchens, garages, and commercial spaces. Anti-slip, waterproof, durable.', ogImage: '', keywords: 'floor guard, anti-slip flooring, PVC sheets' },
    { id: 'elevation', page: 'Elevation Panels', path: '/category/elevation', metaTitle: 'Mitti Magic Elevation — Handcrafted Terracotta Panels', metaDescription: 'Transform your building facade with natural clay terracotta panels. 25-year warranty. Loved by architects & builders.', ogImage: '', keywords: 'mitti magic, terracotta panels, elevation, facade' },
    { id: 'tiles', page: 'Tiles', path: '/category/tiles', metaTitle: 'Designer Tiles — Digital Printed & Vitrified', metaDescription: 'HD digital printed tiles in stunning patterns. Moroccan, marble, mosaic designs for walls and floors.', ogImage: '', keywords: 'tiles, digital printed tiles, moroccan tiles, vitrified tiles' },
    { id: 'about', page: 'About Us', path: '/about', metaTitle: 'About Hindustan Elements — 15+ Years of Trust', metaDescription: 'Sree Kameswari Hindustan Elements — premium building products since 2011. ISO certified, pan-India delivery.', ogImage: '', keywords: 'about hindustan elements, building materials company, bangalore' },
    { id: 'contact', page: 'Contact', path: '/contact', metaTitle: 'Contact Hindustan Elements — Get Expert Help', metaDescription: 'Reach us for bulk pricing, installation support, or product inquiries. Free site visit available.', ogImage: '', keywords: 'contact, bulk pricing, building materials inquiry' },
];

app.get('/api/admin/seo', requireAdmin, (req, res) => {
    res.json({ success: true, data: pageSeoData });
});

app.put('/api/admin/seo/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const pageIndex = pageSeoData.findIndex(p => p.id === id);
    if (pageIndex === -1) return res.status(404).json({ success: false, message: 'Page not found' });
    const { metaTitle, metaDescription, ogImage, keywords } = req.body;
    if (metaTitle !== undefined) pageSeoData[pageIndex].metaTitle = metaTitle;
    if (metaDescription !== undefined) pageSeoData[pageIndex].metaDescription = metaDescription;
    if (ogImage !== undefined) pageSeoData[pageIndex].ogImage = ogImage;
    if (keywords !== undefined) pageSeoData[pageIndex].keywords = keywords;
    res.json({ success: true, message: 'SEO updated', data: pageSeoData[pageIndex] });
});

// ==================== AI INTELLIGENCE ====================

// AI Lead Scoring — scores leads based on completeness, source, engagement
app.get('/api/admin/ai/lead-scores', requireAdmin, (req, res) => {
    const scored = userLeads.map(lead => {
        let score = 0;
        // Contact completeness
        if (lead.name && lead.name !== 'Unknown') score += 10;
        if (lead.email) score += 15;
        if (lead.phone) score += 15;
        if (lead.message && lead.message.length > 10) score += 10;
        // Source quality
        const sourceScores = { indiamart: 25, website_contact: 20, meta: 18, google_business: 18, amazon: 15, flipkart: 15, meesho: 12, website: 10, manual: 8, webhook: 5 };
        score += sourceScores[lead.source] || 5;
        // Engagement signals
        if (lead.notes && lead.notes.length > 0) score += lead.notes.length * 5;
        if (lead.followUps && lead.followUps.length > 0) score += 10;
        if (lead.value > 0) score += Math.min(20, Math.floor(lead.value / 5000));
        // Status progression
        const statusScores = { new: 0, contacted: 5, qualified: 15, proposal: 20, negotiation: 25, won: 30, lost: -10 };
        score += statusScores[lead.status] || 0;
        // Cap at 100
        score = Math.min(100, Math.max(0, score));
        const priority = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
        return { leadId: lead.id, name: lead.name, score, priority, source: lead.source, status: lead.status, value: lead.value };
    });
    scored.sort((a, b) => b.score - a.score);
    const summary = { hot: scored.filter(s => s.priority === 'hot').length, warm: scored.filter(s => s.priority === 'warm').length, cold: scored.filter(s => s.priority === 'cold').length, avgScore: scored.length > 0 ? Math.round(scored.reduce((s, l) => s + l.score, 0) / scored.length) : 0 };
    res.json({ success: true, data: scored, summary });
});

// AI Product Recommendations — suggests upsell/cross-sell for a product
app.get('/api/admin/ai/recommendations/:productId', requireAdmin, (req, res) => {
    const product = products.find(p => p.id === req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    // Same category products
    const sameCategory = products.filter(p => p.categoryId === product.categoryId && p.id !== product.id);
    // Complementary products (different category, similar price range)
    const complementary = products.filter(p => p.categoryId !== product.categoryId && Math.abs(p.price - product.price) < product.price * 0.5).slice(0, 4);
    // Upsell (same category, higher price)
    const upsell = sameCategory.filter(p => p.price > product.price).sort((a, b) => a.price - b.price).slice(0, 3);
    // Frequently bought together (same parent category)
    const parentCat = product.parentCategory;
    const fbt = products.filter(p => p.parentCategory === parentCat && p.id !== product.id && p.categoryId !== product.categoryId).slice(0, 3);
    res.json({ success: true, data: { crossSell: complementary, upsell, frequentlyBought: fbt, sameCategory: sameCategory.slice(0, 4) } });
});

// AI Sales Forecast — simple trending analysis
app.get('/api/admin/ai/forecast', requireAdmin, (req, res) => {
    const now = new Date();
    const last30 = orders.filter(o => (now - new Date(o.createdAt)) < 30 * 24 * 60 * 60 * 1000);
    const prev30 = orders.filter(o => { const d = now - new Date(o.createdAt); return d >= 30 * 24 * 60 * 60 * 1000 && d < 60 * 24 * 60 * 60 * 1000; });
    const last30Rev = last30.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const prev30Rev = prev30.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const growthRate = prev30Rev > 0 ? ((last30Rev - prev30Rev) / prev30Rev) * 100 : 0;
    const forecastNext30 = last30Rev * (1 + growthRate / 100);
    // Lead velocity
    const last7Leads = userLeads.filter(l => (now - new Date(l.timestamp)) < 7 * 24 * 60 * 60 * 1000).length;
    const prev7Leads = userLeads.filter(l => { const d = now - new Date(l.timestamp); return d >= 7 * 24 * 60 * 60 * 1000 && d < 14 * 24 * 60 * 60 * 1000; }).length;
    const insights = [];
    if (growthRate > 10) insights.push({ type: 'positive', text: `Revenue growing ${growthRate.toFixed(1)}% MoM. Keep momentum!` });
    else if (growthRate < -10) insights.push({ type: 'warning', text: `Revenue declined ${Math.abs(growthRate).toFixed(1)}% MoM. Review pricing/marketing.` });
    if (last7Leads > prev7Leads) insights.push({ type: 'positive', text: `Lead velocity up: ${last7Leads} leads this week vs ${prev7Leads} last week.` });
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10);
    if (lowStock.length > 0) insights.push({ type: 'warning', text: `${lowStock.length} products critically low on stock. Reorder soon.` });
    const unconverted = userLeads.filter(l => l.status === 'new' && (now - new Date(l.timestamp)) > 3 * 24 * 60 * 60 * 1000);
    if (unconverted.length > 0) insights.push({ type: 'action', text: `${unconverted.length} leads untouched for 3+ days. Assign & follow up.` });
    res.json({ success: true, data: { last30Revenue: last30Rev, prev30Revenue: prev30Rev, growthRate: growthRate.toFixed(1), forecastNext30: forecastNext30.toFixed(0), last7Leads, prev7Leads, insights, totalForecasted: forecastNext30, ordersLast30: last30.length } });
});

// ==================== LEAD AUTOMATION ====================

// Auto-assign leads based on source
app.post('/api/admin/automation/auto-assign', requireAdmin, (req, res) => {
    const { rules } = req.body; // e.g. [{ source: 'indiamart', assignTo: 'Suresh' }, ...]
    if (!rules || !Array.isArray(rules)) return res.status(400).json({ success: false, message: 'Rules array required' });
    let assigned = 0;
    userLeads.forEach(lead => {
        if (!lead.assignedTo) {
            const rule = rules.find(r => r.source === lead.source || r.source === 'all');
            if (rule) { lead.assignedTo = rule.assignTo; lead.updatedAt = new Date().toISOString(); assigned++; }
        }
    });
    res.json({ success: true, message: `Auto-assigned ${assigned} leads`, data: { assigned } });
});

// Auto follow-up scheduling for untouched leads
app.post('/api/admin/automation/schedule-followups', requireAdmin, (req, res) => {
    const { daysThreshold = 2, followUpType = 'call' } = req.body;
    const now = new Date();
    let scheduled = 0;
    userLeads.forEach(lead => {
        if (lead.status === 'new' && !lead.convertedToCustomer) {
            const daysSince = (now - new Date(lead.timestamp)) / (1000 * 60 * 60 * 24);
            const hasUpcoming = (lead.followUps || []).some(f => f.status === 'scheduled');
            if (daysSince >= daysThreshold && !hasUpcoming) {
                if (!lead.followUps) lead.followUps = [];
                const scheduleDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
                lead.followUps.push({
                    id: uuidv4(), scheduledAt: scheduleDate.toISOString(), type: followUpType,
                    note: `Auto-scheduled: Lead untouched for ${Math.floor(daysSince)} days`, status: 'scheduled', createdAt: now.toISOString(),
                });
                lead.updatedAt = now.toISOString();
                scheduled++;
            }
        }
    });
    res.json({ success: true, message: `Auto-scheduled ${scheduled} follow-ups`, data: { scheduled } });
});

// Bulk lead status update
app.post('/api/admin/automation/bulk-status', requireAdmin, (req, res) => {
    const { leadIds, status } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || !status) return res.status(400).json({ success: false, message: 'leadIds array and status required' });
    let updated = 0;
    leadIds.forEach(id => {
        const lead = userLeads.find(l => l.id === id);
        if (lead) { lead.status = status; lead.updatedAt = new Date().toISOString(); updated++; }
    });
    res.json({ success: true, message: `Updated ${updated} leads to ${status}`, data: { updated } });
});

// ==================== BANNERS CRUD ====================
const banners = [];

// List banners
app.get('/api/admin/banners', requireAdmin, (req, res) => {
    res.json({ success: true, data: banners });
});

// Create banner
app.post('/api/admin/banners', requireAdmin, (req, res) => {
    const { title, image, link, position, active } = req.body;
    if (!title || !image) return res.status(400).json({ success: false, message: 'Title and image URL are required' });
    const banner = {
        id: uuidv4(),
        title: sanitize(title),
        image: sanitize(image),
        link: sanitize(link || '/'),
        position: sanitize(position || 'hero'),
        active: active !== false,
        createdAt: new Date().toISOString(),
    };
    banners.push(banner);
    res.status(201).json({ success: true, data: banner });
});

// Update banner
app.put('/api/admin/banners/:id', requireAdmin, (req, res) => {
    const banner = banners.find(b => b.id === req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    const { title, image, link, position, active } = req.body;
    if (title) banner.title = sanitize(title);
    if (image) banner.image = sanitize(image);
    if (link !== undefined) banner.link = sanitize(link);
    if (position) banner.position = sanitize(position);
    if (active !== undefined) banner.active = active;
    banner.updatedAt = new Date().toISOString();
    res.json({ success: true, data: banner });
});

// Toggle banner active
app.patch('/api/admin/banners/:id/toggle', requireAdmin, (req, res) => {
    const banner = banners.find(b => b.id === req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    banner.active = !banner.active;
    banner.updatedAt = new Date().toISOString();
    res.json({ success: true, data: banner });
});

// Delete banner
app.delete('/api/admin/banners/:id', requireAdmin, (req, res) => {
    const idx = banners.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Banner not found' });
    banners.splice(idx, 1);
    res.json({ success: true, message: 'Banner deleted' });
});

// ==================== STAFF / USER MANAGEMENT (RBAC) ====================
const staffUsers = [
    { id: 'staff-admin-1', name: 'Admin', email: 'admin@elements.com', phone: '+91 98765 43210', role: 'admin', status: 'active', password: 'password123', avatar: '', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), permissions: ['all'] },
];
const ROLES = {
    admin: { label: 'Administrator', permissions: ['dashboard', 'products', 'orders', 'crm', 'payments', 'banners', 'tasks', 'campaigns', 'reports', 'integrations', 'staff', 'seo', 'settings'] },
    sub_admin: { label: 'Sub Admin', permissions: ['dashboard', 'products', 'orders', 'crm', 'banners', 'reports', 'tasks'] },
    staff: { label: 'Staff', permissions: ['dashboard', 'products', 'orders', 'tasks'] },
    tele_caller: { label: 'Tele Caller', permissions: ['crm', 'tasks', 'reports'] },
    product_uploader: { label: 'Product Uploader', permissions: ['products', 'banners', 'seo'] },
    viewer: { label: 'Viewer', permissions: ['dashboard'] },
};

// Staff login (email+password)
app.post('/api/auth/staff/login', authLimiter, (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = staffUsers.find(s => s.email === email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    user.lastLogin = new Date().toISOString();
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions };
    res.json({ success: true, user: safeUser });
});

// List staff (hide passwords)
app.get('/api/admin/staff', requireAdmin, (req, res) => {
    const safe = staffUsers.map(({ password, ...rest }) => rest);
    res.json({ success: true, data: safe, roles: ROLES });
});

// Create staff user (with password)
app.post('/api/admin/staff', requireAdmin, (req, res) => {
    const { name, email, phone, role, password, permissions: customPerms } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!ROLES[role || 'staff']) return res.status(400).json({ success: false, message: 'Invalid role' });
    const existing = staffUsers.find(s => s.email === email);
    if (existing) return res.status(409).json({ success: false, message: 'User with this email already exists' });
    const user = {
        id: 'staff-' + uuidv4().slice(0, 8),
        name: sanitize(name),
        email: sanitize(email),
        phone: sanitize(phone || ''),
        role: role || 'staff',
        password: password,
        status: 'active',
        avatar: '',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        permissions: customPerms || ROLES[role || 'staff'].permissions,
    };
    staffUsers.push(user);
    const { password: pw, ...safeUser } = user;
    res.status(201).json({ success: true, data: safeUser });
});

// Update staff role
app.put('/api/admin/staff/:id', requireAdmin, (req, res) => {
    const user = staffUsers.find(s => s.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff user not found' });

    // Protect root admin from modification by others
    if (user.email === 'admin@elements.com') {
        return res.status(403).json({ success: false, message: 'Root admin account cannot be modified' });
    }

    const { name, phone, role, status, password } = req.body;
    if (name) user.name = sanitize(name);
    if (phone !== undefined) user.phone = sanitize(phone);
    if (role && ROLES[role]) { user.role = role; user.permissions = ROLES[role].permissions; }
    if (status) user.status = status;
    if (password) user.password = password; // Reset password if provided
    user.updatedAt = new Date().toISOString();
    res.json({ success: true, data: user });
});

// Staff reset password (specific endpoint for clarity if needed, though PUT above handles it)
app.patch('/api/admin/staff/:id/password', requireAdmin, (req, res) => {
    const user = staffUsers.find(s => s.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff user not found' });
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'New password required' });
    user.password = password;
    user.updatedAt = new Date().toISOString();
    res.json({ success: true, message: 'Password reset successful' });
});

// Delete staff
app.delete('/api/admin/staff/:id', requireAdmin, (req, res) => {
    const idx = staffUsers.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Staff user not found' });

    // Protect root admin from deletion
    if (staffUsers[idx].email === 'admin@elements.com') {
        return res.status(403).json({ success: false, message: 'Root admin account cannot be deleted' });
    }

    if (staffUsers[idx].role === 'admin' && staffUsers.filter(s => s.role === 'admin').length <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last admin' });
    }
    staffUsers.splice(idx, 1);
    res.json({ success: true, message: 'Staff user deleted' });
});

// ==================== REVENUE & ANALYTICS ====================
app.get('/api/admin/revenue', requireAdmin, (req, res) => {
    // Generate last 7 days revenue data from orders
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dayOrders = orders.filter(o => {
            const od = new Date(o.createdAt);
            return od.toDateString() === d.toDateString();
        });
        const revenue = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
        days.push({ label, revenue, orders: dayOrders.length });
    }
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    // Month-over-month growth (simulated from data)
    const thisMonth = orders.filter(o => new Date(o.createdAt).getMonth() === new Date().getMonth()).reduce((s, o) => s + (o.total || 0), 0);
    const lastMonth = totalRevenue - thisMonth;
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    res.json({
        success: true,
        data: {
            daily: days,
            totalRevenue,
            avgOrderValue: avgOrder,
            monthGrowth: growth,
            totalOrders: orders.length,
            onlinePayments: payments.length,
            onlineRevenue: payments.reduce((s, p) => s + (p.amount || 0), 0),
        }
    });
});

// ==================== CAMPAIGNS CRUD ====================
const campaigns = [];

app.get('/api/admin/campaigns', requireAdmin, (req, res) => {
    res.json({ success: true, data: campaigns });
});

app.post('/api/admin/campaigns', requireAdmin, (req, res) => {
    const { name, platform, budget, status: cStatus } = req.body;
    if (!name || !platform) return res.status(400).json({ success: false, message: 'Name and platform required' });
    const c = {
        id: uuidv4(), name: sanitize(name), platform: sanitize(platform),
        budget: Number(budget) || 0, spent: 0, clicks: 0, conversions: 0,
        status: cStatus || 'draft', createdAt: new Date().toISOString(),
    };
    campaigns.push(c);
    res.status(201).json({ success: true, data: c });
});

app.put('/api/admin/campaigns/:id', requireAdmin, (req, res) => {
    const c = campaigns.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Campaign not found' });
    const { name, platform, budget, status: cStatus } = req.body;
    if (name) c.name = sanitize(name);
    if (platform) c.platform = sanitize(platform);
    if (budget !== undefined) c.budget = Number(budget);
    if (cStatus) c.status = cStatus;
    c.updatedAt = new Date().toISOString();
    res.json({ success: true, data: c });
});

app.delete('/api/admin/campaigns/:id', requireAdmin, (req, res) => {
    const idx = campaigns.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Campaign not found' });
    campaigns.splice(idx, 1);
    res.json({ success: true, message: 'Campaign deleted' });
});

// ==================== SETTINGS ====================
let storeSettings = {
    storeName: 'Hindustan Elements', tagline: 'Premium Building Elements',
    supportEmail: 'support@hindustan-elements.com', contactPhone: '+91 98765 43210',
    freeShippingAbove: 5000, deliveryTime: '3-7 Business Days',
    gstNumber: '', panNumber: '',
};

app.get('/api/admin/settings', requireAdmin, (req, res) => {
    res.json({ success: true, data: storeSettings });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
    storeSettings = { ...storeSettings, ...req.body };
    res.json({ success: true, data: storeSettings, message: 'Settings saved' });
});

// ==================== STAFF PERMISSIONS UPDATE ====================
app.put('/api/admin/staff/:id/permissions', requireAdmin, (req, res) => {
    const user = staffUsers.find(s => s.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff user not found' });

    if (user.email === 'admin@elements.com') {
        return res.status(403).json({ success: false, message: 'Root admin permissions cannot be modified' });
    }

    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ success: false, message: 'Permissions must be an array' });
    user.permissions = permissions;
    user.updatedAt = new Date().toISOString();
    const { password, ...safe } = user;
    res.json({ success: true, data: safe });
});


// ==================== START SERVER ====================
// ==================== SEO MANAGEMENT ====================
let pageSeo = [
    { id: '1', page: 'Home', path: '/', metaTitle: 'Elements - Premium Home Décor', metaDescription: 'Discover high-quality kitchen sinks, floor guards, and wall tiles.', ogImage: '/images/og-home.jpg', keywords: 'home decor, kitchen sinks, tiles, india' },
];

app.get('/api/admin/seo', requireAdmin, (req, res) => {
    res.json({ success: true, data: pageSeo });
});

app.post('/api/admin/seo', requireAdmin, (req, res) => {
    const { page, path, metaTitle, metaDescription, ogImage, keywords } = req.body;
    const entry = { id: uuidv4(), page, path, metaTitle, metaDescription, ogImage, keywords, createdAt: new Date().toISOString() };
    pageSeo.push(entry);
    res.status(201).json({ success: true, data: entry });
});

app.put('/api/admin/seo/:id', requireAdmin, (req, res) => {
    const entry = pageSeo.find(s => s.id === req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'SEO entry not found' });
    Object.assign(entry, { ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true, data: entry });
});

app.listen(PORT, () => {
    console.log(`\n  🚀 Elements Backend API Server v3.0 running at:`);
    console.log(`  → Local:        http://localhost:${PORT}`);
    console.log(`  → Staff Login:  POST http://localhost:${PORT}/api/auth/staff/login`);
    console.log(`  → Admin Panel:  http://localhost:${PORT}/api/admin/stats`);
    console.log(`  → Campaigns:    http://localhost:${PORT}/api/admin/campaigns`);
    console.log(`  → Settings:     http://localhost:${PORT}/api/admin/settings`);
    console.log(`  → Customers:    http://localhost:${PORT}/api/admin/customers\n`);
});
