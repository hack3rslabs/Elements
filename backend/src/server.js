const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const prisma = new PrismaClient();
const { sendOtpSms } = require('./utils/twilio');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== FILE UPLOAD SETUP ====================

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = path.basename(file.originalname, ext)
            .replace(/[^a-z0-9_-]/gi, '-')
            .toLowerCase()
            .slice(0, 40);
        cb(null, `${safeName}-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only image files are allowed (jpg, png, webp, gif, svg)'));
    },
});

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

// Serve uploaded images as static files
app.use('/uploads', express.static(UPLOADS_DIR));

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
    // Recurse into plain objects but never touch arrays or primitives
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const out = {};
        for (const k of Object.keys(value)) {
            out[k] = sanitize(value[k]);
        }
        return out;
    }
    // Arrays, numbers, booleans, null — return as-is
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
const requireAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-admin-key'] || req.headers['x-api-key'];

    const isAdminKeyValid = apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026' ||
        (authHeader && (authHeader === `Bearer ${ADMIN_API_KEY}` || authHeader === 'Bearer elements-admin-key-2026'));

    if (isAdminKeyValid) {
        return next();
    }

    // In a real app, we'd check the session/token for the user's role in DB
    return res.status(403).json({ success: false, message: 'Admin access required' });
};

// Database initialization takes care of data loading
// const { categories, products, reviews } = require('./data/products');

// ==================== In-Memory Stores (Deprecated) ====================
// Transient session data
const carts = {};
const otps = {};
const wishlists = {}; // To be migrated to DB-backed UserWishlist later

// ==================== DTO HELPERS ====================
const DEFAULT_PRODUCT_IMAGE = '/images/products/kicjen sunk 1.webp';
const NEW_ARRIVAL_DAYS = 90;

function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function parseBooleanFlag(value) {
    return value === true || value === 'true' || value === '1' || value === 1;
}

function toStringArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean);
    return [String(value)].filter(Boolean);
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

async function generateUniqueSlug(name, existingProductId = null) {
    const base = slugify(name) || 'product';
    let slug = base;
    let counter = 1;
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (!existing || (existingProductId && existing.id === existingProductId)) return slug;
        counter += 1;
        slug = `${base}-${counter}`;
    }
}

async function generateUniqueCategorySlug(name) {
    const base = slugify(name) || 'category';
    let slug = base;
    let counter = 1;
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (!existing) return slug;
        counter += 1;
        slug = `${base}-${counter}`;
    }
}

async function resolveCategoryId({ categoryId, categoryName }) {
    if (categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: String(categoryId) } });
        if (!cat) throw new Error('Category not found');
        return cat.id;
    }

    if (categoryName) {
        const name = String(categoryName).trim();
        const slug = slugify(name);
        const exact = await prisma.category.findFirst({
            where: { OR: [{ name }, { slug }] },
            orderBy: { createdAt: 'asc' }
        });
        if (exact) return exact.id;

        const partial = await prisma.category.findMany({
            select: { id: true, name: true, slug: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const match = partial.find((cat) => {
            const catName = String(cat.name || '').toLowerCase();
            const catSlug = String(cat.slug || '').toLowerCase();
            const inputName = name.toLowerCase();
            const inputSlug = slug.toLowerCase();
            return (
                catName.includes(inputName) ||
                inputName.includes(catName) ||
                catSlug.includes(inputSlug) ||
                inputSlug.includes(catSlug)
            );
        });
        if (match) return match.id;

        const created = await prisma.category.create({
            data: {
                name,
                slug: await generateUniqueCategorySlug(name),
            }
        });
        return created.id;
    }

    const fallback = await prisma.category.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!fallback) throw new Error('No categories available');
    return fallback.id;
}

function normalizeSpecifications(specifications) {
    if (!specifications || typeof specifications !== 'object' || Array.isArray(specifications)) return {};
    const out = {};
    for (const [key, val] of Object.entries(specifications)) {
        if (val === null || val === undefined) continue;
        out[key] = typeof val === 'string' ? val : String(val);
    }
    return out;
}

function parseTagsFromKeywords(metaKeywords) {
    if (!metaKeywords) return [];
    return String(metaKeywords)
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
}

function computeRatingStats(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) return { rating: 0, reviewCount: 0 };
    const reviewCount = reviews.length;
    const total = reviews.reduce((sum, r) => sum + safeNumber(r.rating, 0), 0);
    const avg = total / reviewCount;
    return { rating: Number(avg.toFixed(1)), reviewCount };
}

function isNewArrival(createdAt) {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return false;
    return Date.now() - d.getTime() <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

function toProductDTO(product) {
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const image = images[0] || DEFAULT_PRODUCT_IMAGE;
    const categoryName = product.category?.name || '';
    const parentCategory = product.category?.parent?.name || product.category?.name || '';
    const { rating, reviewCount } = computeRatingStats(product.reviews);
    const specs = normalizeSpecifications(product.specifications);
    const tags = parseTagsFromKeywords(product.metaKeywords);
    const derivedTags = tags.length > 0 ? tags : [specs.material, specs.finish, categoryName, parentCategory].filter(Boolean);

    return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        price: safeNumber(product.price),
        mrp: safeNumber(product.mrp),
        stockStatus: product.stockStatus,
        stock: safeNumber(product.stock),
        images,
        image,
        specifications: specs,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        categoryId: product.categoryId,
        categoryName,
        parentCategory,
        rating,
        reviewCount,
        isNewArrival: isNewArrival(product.createdAt),
        isBestSeller: reviewCount >= 2,
        tags: derivedTags,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

function toReviewDTO(review) {
    return {
        id: review.id,
        userName: review.user?.name || 'Anonymous',
        rating: safeNumber(review.rating),
        comment: review.comment || '',
        verified: true,
        createdAt: review.createdAt,
    };
}

function computeFacets(products) {
    const materials = new Set();
    const finishes = new Set();
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    let inStock = 0;
    let bestSellers = 0;
    let newArrivals = 0;

    for (const p of products) {
        const material = p.specifications?.material;
        const finish = p.specifications?.finish;
        if (material) materials.add(material);
        if (finish) finishes.add(finish);
        if (Number.isFinite(p.price)) {
            min = Math.min(min, p.price);
            max = Math.max(max, p.price);
        }
        if (p.stockStatus === 'IN_STOCK') inStock += 1;
        if (p.isBestSeller) bestSellers += 1;
        if (p.isNewArrival) newArrivals += 1;
    }

    return {
        materials: Array.from(materials).sort(),
        finishes: Array.from(finishes).sort(),
        priceRange: { min: min === Number.POSITIVE_INFINITY ? 0 : Math.floor(min), max: Math.ceil(max) },
        counts: { inStock, bestSellers, newArrivals },
    };
}

// ==================== AUTH & OTP ====================

app.post('/api/auth/otp/send', authLimiter, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    try {
        // Store OTP in database
        await prisma.verificationOTP.upsert({
            where: { phone },
            update: { otp, expiresAt },
            create: { phone, otp, expiresAt }
        });

        // Send SMS via Twilio
        await sendOtpSms(phone, otp);

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('[AUTH] OTP Send Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

app.post('/api/auth/otp/verify', authLimiter, async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    try {
        const record = await prisma.verificationOTP.findUnique({
            where: { phone }
        });

        if (!record || record.otp !== otp || record.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // OTP is valid, remove it
        await prisma.verificationOTP.delete({ where: { phone } });
        
        // Find or create user
        const user = await prisma.user.upsert({
            where: { email: phone + '@elements.com' }, // Fallback email
            update: { phone, name: 'User ' + phone.slice(-4) },
            create: {
                name: 'User ' + phone.slice(-4),
                email: phone + '@elements.com',
                phone: phone,
                role: 'USER'
            }
        });
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('[AUTH] OTP Verify Error:', error);
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
});

// ==================== ANALYTICS & LEADS ====================
app.post('/api/analytics', (req, res) => {
    // For now, just acknowledged. In a real app, we'd log this to DB or a service.
    res.json({ success: true });
});

app.post('/api/leads', async (req, res) => {
    const { name, email, phone, source = 'website', message = '' } = req.body;
    if (!name && !email && !phone) return res.status(400).json({ success: false, message: 'At least one contact field is required' });

    try {
        const lead = await prisma.cRMLead.create({
            data: {
                name: name || 'Unknown',
                email: email || '',
                phone: phone || '',
                source: source.toUpperCase(),
                status: 'NEW'
            }
        });
        res.status(201).json({ success: true, message: 'Lead captured', data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lead capture failed', error: error.message });
    }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        
        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.image,
            parentId: cat.parentId,
            productCount: cat._count.products
        }));
        
        res.json({ success: true, data: formattedCategories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
});

app.get('/api/categories/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const category = await prisma.category.findUnique({
            where: { slug },
            include: {
                products: {
                    include: {
                        reviews: true
                    }
                },
                children: true,
                parent: true
            }
        });

        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching category', error: error.message });
    }
});

// ==================== PRODUCTS ====================
app.get('/api/products', async (req, res) => {
    const { category, search, minPrice, maxPrice, stockStatus, sort = 'featured', page = 1, limit = 12, bestSeller, newArrival, minRating } = req.query;
    const materials = toStringArray(req.query.material);
    const finishes = toStringArray(req.query.finish);
    
    const where = {};
    
    const categorySlug = Array.isArray(category) ? category[0] : category;
    if (categorySlug) {
        where.category = {
            OR: [
                { slug: String(categorySlug) },
                { parent: { slug: String(categorySlug) } }
            ]
        };
    }
    
    const searchTerm = Array.isArray(search) ? search[0] : search;
    if (searchTerm) {
        where.OR = [
            { name: { contains: String(searchTerm), mode: 'insensitive' } },
            { description: { contains: String(searchTerm), mode: 'insensitive' } },
            { sku: { contains: String(searchTerm), mode: 'insensitive' } }
        ];
    }
    
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (stockStatus) {
        where.stockStatus = stockStatus;
    }

    // Sorting
    try {
        const items = await prisma.product.findMany({
            where,
            include: { category: { include: { parent: true } }, reviews: true },
            orderBy: { createdAt: 'desc' },
        });

        let formatted = items.map(toProductDTO);

        // Additional filters (computed fields/specs)
        if (materials.length > 0) {
            formatted = formatted.filter(p => p.specifications?.material && materials.includes(p.specifications.material));
        }
        if (finishes.length > 0) {
            formatted = formatted.filter(p => p.specifications?.finish && finishes.includes(p.specifications.finish));
        }
        if (minRating) {
            const r = safeNumber(minRating, 0);
            if (r > 0) formatted = formatted.filter(p => p.rating >= r);
        }
        if (parseBooleanFlag(bestSeller)) {
            formatted = formatted.filter(p => p.isBestSeller);
        }
        if (parseBooleanFlag(newArrival)) {
            formatted = formatted.filter(p => p.isNewArrival);
        }

        // Sorting (UI friendly)
        const sortKey = String(sort || 'featured');
        if (sortKey === 'price_asc') formatted.sort((a, b) => a.price - b.price);
        else if (sortKey === 'price_desc') formatted.sort((a, b) => b.price - a.price);
        else if (sortKey === 'rating') formatted.sort((a, b) => b.rating - a.rating);
        else if (sortKey === 'popularity') formatted.sort((a, b) => b.reviewCount - a.reviewCount);
        else if (sortKey === 'newest') formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        else formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const facets = computeFacets(formatted);

        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 12));
        const total = formatted.length;
        const pages = Math.max(1, Math.ceil(total / limitNum));
        const start = (pageNum - 1) * limitNum;
        const paged = formatted.slice(start, start + limitNum);

        res.json({
            success: true,
            data: paged,
            facets,
            pagination: { total, page: pageNum, limit: limitNum, pages },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
    }
});

// GET single product
app.get('/api/products/:slug', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: req.params.slug },
            include: {
                category: { include: { parent: true } },
                reviews: {
                    include: { user: { select: { name: true, image: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Find related products
        const related = await prisma.product.findMany({
            where: { categoryId: product.categoryId, NOT: { id: product.id } },
            take: 4,
            include: { category: { include: { parent: true } }, reviews: true },
            orderBy: { createdAt: 'desc' },
        });

        const formatted = toProductDTO(product);
        const reviews = Array.isArray(product.reviews) ? product.reviews.map(toReviewDTO) : [];
        const relatedProducts = related.map(toProductDTO);

        res.json({ success: true, data: { ...formatted, reviews, relatedProducts } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching product', error: error.message });
    }
});

app.post('/api/products', requireAdmin, async (req, res) => {
    console.log('[CREATE PRODUCT] Incoming body:', JSON.stringify(req.body));
    try {
        const body = req.body || {};
        if (!body.name || !body.sku || body.price === undefined || body.mrp === undefined) {
            console.warn('[CREATE PRODUCT] Missing required fields:', { name: body.name, sku: body.sku, price: body.price, mrp: body.mrp });
            return res.status(400).json({ success: false, message: 'name, sku, price and mrp are required' });
        }

        const price = safeNumber(body.price, NaN);
        const mrp = safeNumber(body.mrp, NaN);
        if (!Number.isFinite(price) || !Number.isFinite(mrp)) {
            return res.status(400).json({ success: false, message: 'price and mrp must be numbers' });
        }

        const categoryId = await resolveCategoryId({
            categoryId: body.categoryId,
            categoryName: body.categoryName || body.category,
        });
        console.log('[CREATE PRODUCT] Resolved categoryId:', categoryId);

        const slug = await generateUniqueSlug(body.slug || body.name);
        const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];

        // Accept tags as array OR comma-separated string (defensive against sanitizeBody)
        let tags = [];
        if (Array.isArray(body.tags)) {
            tags = body.tags.map(t => String(t).trim()).filter(Boolean);
        } else if (typeof body.tags === 'string' && body.tags.trim()) {
            tags = body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        const metaKeywords = body.metaKeywords || (tags.length > 0 ? tags.join(', ') : undefined);

        const created = await prisma.product.create({
            data: {
                name: String(body.name),
                sku: String(body.sku),
                slug,
                shortDescription: body.shortDescription ? String(body.shortDescription) : undefined,
                description: body.description ? String(body.description) : undefined,
                price,
                mrp,
                stockStatus: body.stockStatus ? String(body.stockStatus) : undefined,
                stock: body.stock !== undefined ? safeNumber(body.stock) : undefined,
                images,
                specifications: body.specifications && typeof body.specifications === 'object' ? body.specifications : undefined,
                metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
                metaDescription: body.metaDescription ? String(body.metaDescription) : undefined,
                metaKeywords: metaKeywords ? String(metaKeywords) : undefined,
                categoryId,
            }
        });

        console.log('[CREATE PRODUCT] ✅ Created id:', created.id, 'sku:', created.sku);

        const full = await prisma.product.findUnique({
            where: { id: created.id },
            include: { category: { include: { parent: true } }, reviews: true },
        });

        res.status(201).json({ success: true, message: 'Product created', data: full ? toProductDTO(full) : toProductDTO(created) });
    } catch (error) {
        console.error('[CREATE PRODUCT] ❌ Error:', error.message, '| code:', error.code);
        // Surface a friendly message for common Prisma errors
        let message = 'Error creating product';
        if (error.code === 'P2002') message = `A product with that ${error.meta?.target?.join(', ') || 'SKU or slug'} already exists.`;
        if (error.message?.includes('DATABASE_URL')) message = 'Database not configured. Check DATABASE_URL in .env';
        res.status(500).json({ success: false, message, error: error.message, code: error.code });
    }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const body = req.body || {};
        const data = {};

        if (body.name !== undefined) data.name = String(body.name);
        if (body.sku !== undefined) data.sku = String(body.sku);
        if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription ? String(body.shortDescription) : null;
        if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
        if (body.price !== undefined) {
            const price = safeNumber(body.price, NaN);
            if (!Number.isFinite(price)) return res.status(400).json({ success: false, message: 'price must be a number' });
            data.price = price;
        }
        if (body.mrp !== undefined) {
            const mrp = safeNumber(body.mrp, NaN);
            if (!Number.isFinite(mrp)) return res.status(400).json({ success: false, message: 'mrp must be a number' });
            data.mrp = mrp;
        }
        if (body.stockStatus !== undefined) data.stockStatus = String(body.stockStatus);
        if (body.stock !== undefined) {
            const stock = safeNumber(body.stock, NaN);
            if (!Number.isFinite(stock)) return res.status(400).json({ success: false, message: 'stock must be a number' });
            data.stock = stock;
        }
        if (body.images !== undefined) data.images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
        if (body.specifications !== undefined && typeof body.specifications === 'object') data.specifications = body.specifications;
        if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle ? String(body.metaTitle) : null;
        if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription ? String(body.metaDescription) : null;

        if (body.metaKeywords !== undefined) {
            data.metaKeywords = body.metaKeywords ? String(body.metaKeywords) : null;
        } else if (body.tags !== undefined) {
            const tags = Array.isArray(body.tags) ? body.tags.map(t => String(t).trim()).filter(Boolean) : [];
            data.metaKeywords = tags.length > 0 ? tags.join(', ') : null;
        }

        if (body.slug !== undefined && body.slug) {
            data.slug = await generateUniqueSlug(body.slug, id);
        }

        if (body.categoryId !== undefined || body.categoryName !== undefined || body.category !== undefined) {
            data.categoryId = await resolveCategoryId({
                categoryId: body.categoryId,
                categoryName: body.categoryName || body.category,
            });
        }

        await prisma.product.update({ where: { id }, data });

        const full = await prisma.product.findUnique({
            where: { id },
            include: { category: { include: { parent: true } }, reviews: true },
        });
        res.json({ success: true, message: 'Product updated', data: full ? toProductDTO(full) : null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
    }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`[DELETE PRODUCT] Attempting to delete product id=${id}`);

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                _count: { select: { reviews: true, orderItems: true } },
            },
        });

        if (!product) {
            console.warn(`[DELETE PRODUCT] Product id=${id} not found in DB`);
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        console.log(`[DELETE PRODUCT] Found: "${product.name}" | reviews=${product._count.reviews} | orderItems=${product._count.orderItems}`);

        // Use a transaction to cascade-delete child records first,
        // then delete the product — avoids FK constraint errors.
        await prisma.$transaction(async (tx) => {
            // 1. Delete reviews referencing this product
            if (product._count.reviews > 0) {
                const deleted = await tx.review.deleteMany({ where: { productId: id } });
                console.log(`[DELETE PRODUCT] Removed ${deleted.count} review(s)`);
            }

            // 2. Delete order items referencing this product
            //    NOTE: OrderItems record historical sales data — consider
            //    whether hard-deleting them is acceptable for your business.
            //    If not, use a soft-delete (isDeleted flag) on Product instead.
            if (product._count.orderItems > 0) {
                const deleted = await tx.orderItem.deleteMany({ where: { productId: id } });
                console.log(`[DELETE PRODUCT] Removed ${deleted.count} order item(s)`);
            }

            // 3. Now safe to delete the product
            await tx.product.delete({ where: { id } });
            console.log(`[DELETE PRODUCT] Successfully deleted product id=${id}`);
        });

        return res.json({ success: true, message: 'Product deleted', id });

    } catch (error) {
        console.error(`[DELETE PRODUCT] ERROR for id=${id}:`, error.message);
        return res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message,
        });
    }
});


app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: { products: [], suggestions: [] } });

    try {
        const results = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { slug: { contains: q, mode: 'insensitive' } }
                ]
            },
            take: 10,
            include: { category: { include: { parent: true } }, reviews: true },
            orderBy: { createdAt: 'desc' },
        });

        const products = results.map(toProductDTO).map(p => ({
            name: p.name,
            slug: p.slug,
            price: p.price,
            mrp: p.mrp,
            image: p.image,
            categoryName: p.categoryName,
        }));

        res.json({ success: true, data: { products, suggestions: [], total: products.length } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Search failed', error: error.message });
    }
});

// ==================== CART ====================
app.get('/api/cart', async (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const cartItems = carts[sessionId] || [];
    
    try {
        const productIds = cartItems.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { category: { include: { parent: true } }, reviews: true },
        });
        const byId = new Map(products.map(p => [p.id, p]));

        const enriched = cartItems.map((item) => {
            const product = byId.get(item.productId);
            return { ...item, product: product ? toProductDTO(product) : null };
        });

        const activeItems = enriched.filter(item => item.product);
        const subtotal = activeItems.reduce((sum, item) => sum + (safeNumber(item.product.price) * item.quantity), 0);
        const mrpTotal = activeItems.reduce((sum, item) => sum + (safeNumber(item.product.mrp) * item.quantity), 0);

        res.json({ 
            success: true, 
            data: { 
                items: activeItems, 
                subtotal, 
                mrpTotal, 
                savings: mrpTotal - subtotal, 
                itemCount: activeItems.reduce((sum, item) => sum + item.quantity, 0) 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cart retrieval failed', error: error.message });
    }
});

app.post('/api/cart', async (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (!carts[sessionId]) carts[sessionId] = [];
        const existing = carts[sessionId].find(item => item.productId === productId);
        if (existing) {
            existing.quantity += Number(quantity);
        } else {
            carts[sessionId].push({ id: uuidv4(), productId, quantity: Number(quantity) });
        }
        res.json({ success: true, message: 'Added to cart' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cart update failed', error: error.message });
    }
});

app.put('/api/cart/:productId', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { productId } = req.params;
    const quantity = safeNumber(req.body?.quantity, NaN);
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    if (!Number.isFinite(quantity)) return res.status(400).json({ success: false, message: 'Quantity is required' });

    if (!carts[sessionId]) carts[sessionId] = [];
    const idx = carts[sessionId].findIndex(item => item.productId === productId);

    if (quantity <= 0) {
        if (idx >= 0) carts[sessionId].splice(idx, 1);
        return res.json({ success: true, message: 'Cart item removed' });
    }

    if (idx >= 0) {
        carts[sessionId][idx].quantity = quantity;
    } else {
        carts[sessionId].push({ id: uuidv4(), productId, quantity });
    }

    return res.json({ success: true, message: 'Cart updated' });
});

app.delete('/api/cart/:productId', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    if (!carts[sessionId]) carts[sessionId] = [];
    carts[sessionId] = carts[sessionId].filter(item => item.productId !== productId);
    return res.json({ success: true, message: 'Cart item removed' });
});

// ==================== WISHLIST ====================
app.get('/api/wishlist', async (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    // For now, continue using in-memory carts/wishlists as session-based, 
    // but ideally these should be linked to user accounts in DB.
    const wishlistIds = wishlists[sessionId] || [];
    try {
        const products = await prisma.product.findMany({
            where: { id: { in: wishlistIds } },
            include: { category: { include: { parent: true } }, reviews: true },
        });
        res.json({ success: true, data: products.map(toProductDTO) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Wishlist fetch failed', error: error.message });
    }
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
app.get('/api/reviews/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const productReviews = await prisma.review.findMany({
            where: { productId },
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const ratings = productReviews.map(r => r.rating);
        const stats = {
            total: productReviews.length,
            average: productReviews.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / productReviews.length).toFixed(1) : 0,
            distribution: [5, 4, 3, 2, 1].map(star => ({ star, count: ratings.filter(r => r === star).length })),
        };
        res.json({ success: true, data: { reviews: productReviews, stats } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Reviews fetch failed', error: error.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    const { productId, rating, comment, userName, userId } = req.body;
    if (!productId || !rating) return res.status(400).json({ success: false, message: 'Product ID and rating required' });

    try {
        const review = await prisma.review.create({
            data: {
                rating: Math.min(5, Math.max(1, parseInt(rating))),
                comment: comment || '',
                productId,
                userId: userId || null // In a real app, authenticated user ID
            }
        });
        res.json({ success: true, message: 'Review submitted', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Review submission failed', error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const [totalProducts, totalCategories, bestSellers, newArrivals] = await Promise.all([
            prisma.product.count(),
            prisma.category.count(),
            prisma.product.count({ where: { stock: { gt: 0 } } }), // Example: stock > 0
            prisma.product.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }) // Last 30 days
        ]);

        res.json({
            success: true,
            data: {
                totalProducts,
                totalCategories,
                bestSellers,
                newArrivals,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Stats failed', error: error.message });
    }
});

// ==================== NEWSLETTER ====================
app.post('/api/newsletter', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    try {
        const subscriber = await prisma.user.upsert({
            where: { email },
            update: { newsletterSubscribed: true },
            create: { email, name: email.split('@')[0], newsletterSubscribed: true }
        });
        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Subscription failed', error: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message, type = 'general' } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    
    try {
        const lead = await prisma.cRMLead.create({
            data: {
                name,
                email,
                phone: phone || '',
                source: 'WEBSITE_CONTACT',
                status: 'NEW'
            }
        });
        res.json({ success: true, message: 'Inquiry submitted. We\'ll get back to you shortly!', data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Submission failed', error: error.message });
    }
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

// Note: /api/orders handles checkout (POST) and status (GET)
// Migrated to checkout transaction logic above (POST /api/checkout)

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
             where: { id: req.params.id },
             include: { items: { include: { product: true } } }
        });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Order fetch failed', error: error.message });
    }
});

// ==================== ADMIN API ENDPOINTS ====================

// GET all orders (admin)
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status.toUpperCase();

    try {
        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
                include: { items: { include: { product: true } } }
            }),
            prisma.order.count({ where })
        ]);

        res.json({ 
            success: true, 
            data: orders, 
            pagination: { 
                total, 
                page: Number(page), 
                limit: Number(limit), 
                totalPages: Math.ceil(total / Number(limit)) 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Admin orders fetch failed', error: error.message });
    }
});

// UPDATE order status (admin)
app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const timeline = Array.isArray(order.timeline) ? order.timeline : [];
        const newTimelineEntry = {
            status: status.charAt(0) + status.slice(1).toLowerCase(),
            time: new Date().toISOString(),
            description: `Order status updated to ${status}`
        };

        const updated = await prisma.order.update({
            where: { id },
            data: { 
                status: status.toUpperCase(),
                timeline: {
                    push: newTimelineEntry
                }
            }
        });
        res.json({ success: true, message: `Order ${id} updated to ${status}`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Order update failed', error: error.message });
    }
});

// ==================== ADMIN DASHBOARD STATS ====================
// ==================== ADMIN DASHBOARD STATS ====================
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const [products, orders, leads, newsletter] = await Promise.all([
            prisma.product.count(),
            prisma.order.count(),
            prisma.cRMLead.count(),
            prisma.user.count({ where: { newsletterSubscribed: true } })
        ]);

        const revenue = await prisma.order.aggregate({
            _sum: { total: true },
            where: { status: { not: 'CANCELLED' } }
        });

        res.json({
            success: true,
            data: {
                totalProducts: products,
                totalOrders: orders,
                totalRevenue: Number(revenue._sum.total || 0).toFixed(2),
                totalLeads: leads,
                totalSubscribers: newsletter,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Stats fetch failed', error: error.message });
    }
});

// ==================== CRM / LEADS (Full CRUD) ====================

// GET all leads
app.get('/api/admin/leads', requireAdmin, async (req, res) => {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (status && status !== 'all') where.status = status.toUpperCase();
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
        ];
    }

    try {
        const skip = (Number(page) - 1) * Number(limit);
        const [leads, total] = await Promise.all([
            prisma.cRMLead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.cRMLead.count({ where })
        ]);

        res.json({ 
            success: true, 
            data: leads, 
            pagination: { 
                total, 
                page: Number(page), 
                limit: Number(limit), 
                totalPages: Math.ceil(total / Number(limit)) 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch leads', error: error.message });
    }
});

// GET single lead
app.get('/api/admin/leads/:id', requireAdmin, async (req, res) => {
    try {
        const lead = await prisma.cRMLead.findUnique({ where: { id: req.params.id } });
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lead fetch failed', error: error.message });
    }
});

// CREATE lead manually
app.post('/api/admin/leads', requireAdmin, async (req, res) => {
    const { name, email, phone, source = 'manual', status = 'NEW' } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    try {
        const lead = await prisma.cRMLead.create({
            data: {
                name,
                email: email || '',
                phone: phone || '',
                source,
                status: status.toUpperCase()
            }
        });
        res.status(201).json({ success: true, message: 'Lead created', data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lead creation failed', error: error.message });
    }
});

// UPDATE lead
app.put('/api/admin/leads/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const lead = await prisma.cRMLead.update({
            where: { id },
            data: req.body
        });
        res.json({ success: true, message: 'Lead updated', data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lead update failed', error: error.message });
    }
});

// DELETE lead
app.delete('/api/admin/leads/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.cRMLead.delete({ where: { id } });
        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lead deletion failed', error: error.message });
    }
});

// UPDATE lead status
app.patch('/api/admin/leads/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const lead = await prisma.cRMLead.update({
            where: { id },
            data: { status: status.toUpperCase() }
        });
        res.json({ success: true, message: `Lead status updated to ${status}`, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status update failed', error: error.message });
    }
});

// ADD follow-up note to lead
app.post('/api/admin/leads/:id/notes', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { note, type = 'NOTE' } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note text is required' });

    try {
        const lead = await prisma.cRMLead.update({
            where: { id },
            data: {
                notes: {
                    push: {
                        id: uuidv4(),
                        text: note,
                        type: type.toUpperCase(),
                        createdBy: 'Admin',
                        createdAt: new Date()
                    }
                }
            }
        });
        res.json({ success: true, message: 'Note added', data: lead.notes[lead.notes.length - 1] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Note addition failed', error: error.message });
    }
});

// ADD follow-up schedule
app.post('/api/admin/leads/:id/followups', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { scheduledAt, type = 'CALL', note = '' } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'Scheduled date/time is required' });

    try {
        const followUp = {
            id: uuidv4(),
            scheduledAt: new Date(scheduledAt),
            type: type.toUpperCase(),
            note,
            status: 'SCHEDULED',
            createdAt: new Date()
        };

        const lead = await prisma.cRMLead.update({
            where: { id },
            data: {
                followUps: {
                    push: followUp
                }
            }
        });

        res.json({ success: true, message: 'Follow-up scheduled', data: followUp });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Follow-up scheduling failed', error: error.message });
    }
});

// UPDATE follow-up status
app.patch('/api/admin/leads/:id/followups/:followUpId', requireAdmin, async (req, res) => {
    const { id, followUpId } = req.params;
    const { status } = req.body;

    try {
        const lead = await prisma.cRMLead.findUnique({ where: { id } });
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        const followUps = Array.isArray(lead.followUps) ? lead.followUps : [];
        const followUp = followUps.find(f => f.id === followUpId);
        if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });

        followUp.status = status;
        followUp.updatedAt = new Date().toISOString();

        const updated = await prisma.cRMLead.update({
            where: { id },
            data: { followUps }
        });

        res.json({ success: true, message: 'Follow-up updated', data: followUp });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Follow-up update failed', error: error.message });
    }
});

// CONVERT lead to customer
app.post('/api/admin/leads/:id/convert', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const lead = await prisma.cRMLead.findUnique({ where: { id } });
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        if (lead.status === 'WON') return res.status(400).json({ success: false, message: 'Lead already converted' });

        // Create a user for this customer if they don't exist
        const user = await prisma.user.upsert({
            where: { email: lead.email || (lead.phone + '@elements.com') },
            update: { role: 'USER' },
            create: {
                name: lead.name,
                email: lead.email || (lead.phone + '@elements.com'),
                phone: lead.phone,
                role: 'USER'
            }
        });

        // Update lead status
        await prisma.cRMLead.update({
            where: { id },
            data: { status: 'WON' }
        });

        res.json({ success: true, message: 'Lead converted to customer', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Conversion failed', error: error.message });
    }
});

// ==================== CUSTOMERS ====================
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
    try {
        const customers = await prisma.user.findMany({
            where: { role: 'USER' },
            include: {
                orders: true,
                leads: true
            }
        });
        
        const formatted = customers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            joined: c.createdAt,
            totalOrders: c.orders.length,
            totalSpend: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
            lastOrder: c.orders.length > 0 ? c.orders[0].createdAt : null,
            type: c.leads.length > 0 ? 'converted' : 'direct'
        }));
        
        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
    }
});


// ==================== ONLINE PAYMENTS ====================
app.get('/api/admin/payments', requireAdmin, async (req, res) => {
    // Note: Payments are currently tied to orders in our schema. 
    // We can fetch them from Order model or add a separate Payment model if needed.
    // For now, let's treat completed orders as payments.
    try {
        const orders = await prisma.order.findMany({
            where: { paymentStatus: 'COMPLETED' },
            orderBy: { createdAt: 'desc' }
        });
        
        const summary = {
            totalCollected: orders.reduce((s, o) => s + Number(o.total), 0),
            totalPending: 0,
            totalRefunded: 0,
            byMethod: {},
        };
        
        res.json({ success: true, data: orders, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment fetch failed', error: error.message });
    }
});

// ==================== WEBHOOK RECEIVERS ====================

// Generic webhook
app.post('/api/webhooks/generic', async (req, res) => {
    const { name, email, phone, source = 'webhook', message = '' } = req.body;
    if (!name && !email && !phone) return res.status(400).json({ success: false, message: 'At least one contact field is required' });
    try {
        await prisma.cRMLead.create({
            data: {
                name: name || 'Unknown',
                email: email || '',
                phone: phone || '',
                source: source || 'WEBHOOK',
                status: 'NEW'
            }
        });
        res.status(201).json({ success: true, message: 'Lead captured' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lead capture failed', error: error.message });
    }
});

// IndiaMART webhook
app.post('/api/webhooks/indiamart', async (req, res) => {
    const { SENDER_NAME, SENDER_EMAIL, SENDER_MOBILE } = req.body;
    try {
        await prisma.cRMLead.create({
            data: {
                name: SENDER_NAME || 'IndiaMART Lead',
                email: SENDER_EMAIL || '',
                phone: SENDER_MOBILE || '',
                source: 'INDIAMART',
                status: 'NEW'
            }
        });
        res.status(201).json({ success: true, message: 'IndiaMART lead captured' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'IndiaMART lead capture failed', error: error.message });
    }
});

// Amazon webhook
app.post('/api/webhooks/amazon', async (req, res) => {
    const { customerName, email, phone } = req.body;
    try {
        await prisma.cRMLead.create({
            data: {
                name: customerName || 'Amazon Customer',
                email: email || '',
                phone: phone || '',
                source: 'AMAZON',
                status: 'NEW'
            }
        });
        res.status(201).json({ success: true, message: 'Amazon lead captured' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Amazon lead capture failed', error: error.message });
    }
});

// Flipkart webhook
app.post('/api/webhooks/flipkart', async (req, res) => {
    const { customerName, email, phone } = req.body;
    try {
        await prisma.cRMLead.create({
            data: {
                name: customerName || 'Flipkart Customer',
                email: email || '',
                phone: phone || '',
                source: 'FLIPKART',
                status: 'NEW'
            }
        });
        res.status(201).json({ success: true, message: 'Flipkart lead captured' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Flipkart lead capture failed', error: error.message });
    }
});

// Meesho webhook
app.post('/api/webhooks/meesho', async (req, res) => {
    const { customerName, email, phone } = req.body;
    try {
        await prisma.cRMLead.create({
            data: {
                name: customerName || 'Meesho Customer',
                email: email || '',
                phone: phone || '',
                source: 'MEESHO',
                status: 'NEW'
            }
        });
        res.status(201).json({ success: true, message: 'Meesho lead captured' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Meesho lead capture failed', error: error.message });
    }
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
app.get('/api/admin/ai/forecast', requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: sixtyDaysAgo } }
        });
        const leads = await prisma.cRMLead.findMany({
            where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } }
        });
        const lowStockProducts = await prisma.product.count({
            where: { stock: { gt: 0, lt: 10 } }
        });

        const last30 = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
        const prev30 = orders.filter(o => new Date(o.createdAt) < thirtyDaysAgo);
        
        const last30Rev = last30.reduce((s, o) => s + Number(o.total), 0);
        const prev30Rev = prev30.reduce((s, o) => s + Number(o.total), 0);
        const growthRate = prev30Rev > 0 ? ((last30Rev - prev30Rev) / prev30Rev) * 100 : 0;
        const forecastNext30 = last30Rev * (1 + growthRate / 100);

        const last7Leads = leads.filter(l => new Date(l.createdAt) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length;
        const prev7Leads = leads.length - last7Leads;

        const insights = [];
        if (growthRate > 10) insights.push({ type: 'positive', text: `Revenue growing ${growthRate.toFixed(1)}% MoM. Keep momentum!` });
        else if (growthRate < -10) insights.push({ type: 'warning', text: `Revenue declined ${Math.abs(growthRate).toFixed(1)}% MoM. Review pricing/marketing.` });
        if (last7Leads > prev7Leads) insights.push({ type: 'positive', text: `Lead velocity up: ${last7Leads} leads this week vs ${prev7Leads} last week.` });
        if (lowStockProducts > 0) insights.push({ type: 'warning', text: `${lowStockProducts} products critically low on stock. Reorder soon.` });

        res.json({
            success: true,
            data: {
                last30Revenue: last30Rev,
                prev30Revenue: prev30Rev,
                growthRate: growthRate.toFixed(1),
                forecastNext30: forecastNext30.toFixed(0),
                last7Leads,
                prev7Leads,
                insights,
                totalForecasted: forecastNext30,
                ordersLast30: last30.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Forecast failed', error: error.message });
    }
});

// ==================== LEAD AUTOMATION ====================

// Auto-assign leads based on source
app.post('/api/admin/automation/auto-assign', requireAdmin, async (req, res) => {
    const { rules } = req.body; // e.g. [{ source: 'INDIAMART', assignTo: 'Suresh' }, ...]
    if (!rules || !Array.isArray(rules)) return res.status(400).json({ success: false, message: 'Rules array required' });
    
    try {
        let assignedCount = 0;
        const unassignedLeads = await prisma.cRMLead.findMany({
            where: { status: 'NEW' }
        });

        for (const lead of unassignedLeads) {
            const rule = rules.find(r => r.source === lead.source || r.source === 'ALL');
            if (rule) {
                await prisma.cRMLead.update({
                    where: { id: lead.id },
                    data: { status: 'ASSIGNED' }
                });
                assignedCount++;
            }
        }
        res.json({ success: true, message: `Auto-assigned ${assignedCount} leads` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Auto-assignment failed', error: error.message });
    }
});

// Bulk lead status update
app.post('/api/admin/automation/bulk-status', requireAdmin, async (req, res) => {
    const { leadIds, status } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || !status) return res.status(400).json({ success: false, message: 'leadIds array and status required' });
    try {
        const result = await prisma.cRMLead.updateMany({
            where: { id: { in: leadIds } },
            data: { status: status.toUpperCase() }
        });
        res.json({ success: true, message: `Updated ${result.count} leads to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Bulk update failed', error: error.message });
    }
});

// ==================== BANNERS CRUD ====================

// List banners
app.get('/api/admin/banners', requireAdmin, async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Banners fetch failed', error: error.message });
    }
});

// Create banner
app.post('/api/admin/banners', requireAdmin, async (req, res) => {
    const { title, image, link, position, active } = req.body;
    if (!title || !image) return res.status(400).json({ success: false, message: 'Title and image URL are required' });
    try {
        const banner = await prisma.banner.create({
            data: {
                title: sanitize(title),
                image: sanitize(image),
                link: sanitize(link || '/'),
                position: sanitize(position || 'hero'),
                active: active !== false
            }
        });
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Banner creation failed', error: error.message });
    }
});

// Update banner
app.put('/api/admin/banners/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const banner = await prisma.banner.update({
            where: { id },
            data: { ...req.body }
        });
        res.json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Banner update failed', error: error.message });
    }
});

// Toggle banner active
app.patch('/api/admin/banners/:id/toggle', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
        const updated = await prisma.banner.update({
            where: { id },
            data: { active: !banner.active }
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Toggle failed', error: error.message });
    }
});

// Delete banner
app.delete('/api/admin/banners/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.banner.delete({ where: { id } });
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
    }
});

// ==================== STAFF / USER MANAGEMENT (RBAC) ====================
const ROLES = {
    admin: { label: 'Administrator', permissions: ['dashboard', 'products', 'orders', 'crm', 'payments', 'banners', 'tasks', 'campaigns', 'reports', 'integrations', 'staff', 'seo', 'settings'] },
    sub_admin: { label: 'Sub Admin', permissions: ['dashboard', 'products', 'orders', 'crm', 'banners', 'reports', 'tasks'] },
    staff: { label: 'Staff', permissions: ['dashboard', 'products', 'orders', 'tasks'] },
    tele_caller: { label: 'Tele Caller', permissions: ['crm', 'tasks', 'reports'] },
    product_uploader: { label: 'Product Uploader', permissions: ['products', 'banners', 'seo'] },
    viewer: { label: 'Viewer', permissions: ['dashboard'] },
};

// Staff login (email+password)
app.post('/api/auth/staff/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
});

// List staff
app.get('/api/admin/staff', requireAdmin, async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Staff fetch failed', error: error.message });
    }
});

// ==================== REVENUE & ANALYTICS ====================
app.get('/api/admin/revenue', requireAdmin, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { status: { not: 'CANCELLED' } },
            orderBy: { createdAt: 'asc' }
        });

        const payments = await prisma.order.findMany({
            where: { paymentStatus: 'COMPLETED' }
        });

        // Generate last 7 days revenue data from orders
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
            const dayOrders = orders.filter(o => {
                const od = new Date(o.createdAt);
                return od.toDateString() === d.toDateString();
            });
            const revenue = dayOrders.reduce((s, o) => s + Number(o.total), 0);
            days.push({ label, revenue, orders: dayOrders.length });
        }

        const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
        const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
        
        const thisMonth = orders.filter(o => new Date(o.createdAt).getMonth() === new Date().getMonth()).reduce((s, o) => s + Number(o.total), 0);
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
                onlineRevenue: payments.reduce((s, p) => s + Number(p.total), 0),
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Revenue analysis failed', error: error.message });
    }
});

// ==================== CAMPAIGNS CRUD ====================

app.get('/api/admin/campaigns', requireAdmin, async (req, res) => {
    try {
        const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: campaigns });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Campaigns fetch failed', error: error.message });
    }
});

app.post('/api/admin/campaigns', requireAdmin, async (req, res) => {
    const { name, platform, budget, status: cStatus } = req.body;
    if (!name || !platform) return res.status(400).json({ success: false, message: 'Name and platform required' });
    try {
        const c = await prisma.campaign.create({
            data: {
                name: sanitize(name),
                platform: sanitize(platform),
                budget: Number(budget) || 0,
                status: cStatus || 'draft'
            }
        });
        res.status(201).json({ success: true, data: c });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Campaign creation failed', error: error.message });
    }
});

app.put('/api/admin/campaigns/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const c = await prisma.campaign.update({
            where: { id },
            data: { ...req.body }
        });
        res.json({ success: true, data: c });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Campaign update failed', error: error.message });
    }
});

app.delete('/api/admin/campaigns/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.campaign.delete({ where: { id } });
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
    }
});

// ==================== SETTINGS ====================

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
        let settings = await prisma.setting.findUnique({ where: { id: 'global' } });
        if (!settings) {
            settings = await prisma.setting.create({ data: { id: 'global' } });
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Settings fetch failed', error: error.message });
    }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
        const settings = await prisma.setting.upsert({
            where: { id: 'global' },
            update: { ...req.body },
            create: { id: 'global', ...req.body }
        });
        res.json({ success: true, data: settings, message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Settings update failed', error: error.message });
    }
});

// ==================== STAFF PERMISSIONS UPDATE ====================
app.put('/api/admin/staff/:id/permissions', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) return res.status(400).json({ success: false, message: 'Permissions must be an array' });

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ success: false, message: 'Staff user not found' });

        if (user.email === 'admin@elements.com') {
            return res.status(403).json({ success: false, message: 'Root admin permissions cannot be modified' });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { permissions },
            select: { id: true, name: true, email: true, role: true, permissions: true, createdAt: true }
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Permissions update failed', error: error.message });
    }
});


// ==================== START SERVER ====================
// ==================== SEO MANAGEMENT ====================

app.get('/api/admin/seo', requireAdmin, async (req, res) => {
    try {
        const seo = await prisma.sEO.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: seo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SEO fetch failed', error: error.message });
    }
});

app.post('/api/admin/seo', requireAdmin, async (req, res) => {
    try {
        const entry = await prisma.sEO.create({ data: { ...req.body } });
        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SEO creation failed', error: error.message });
    }
});

app.put('/api/admin/seo/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const entry = await prisma.sEO.update({ where: { id }, data: { ...req.body } });
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SEO update failed', error: error.message });
    }
});


// ==================== HERO SLIDES ====================

// Public: fetch all active slides (used by the frontend homepage)
app.get('/api/heroslides', async (req, res) => {
    try {
        const slides = await prisma.heroSlide.findMany({
            where: { status: 'active' },
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: slides });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides', error: error.message });
    }
});

// Admin: fetch ALL slides (active + inactive)
app.get('/api/admin/heroslides', requireAdmin, async (req, res) => {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: slides });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides', error: error.message });
    }
});

// Admin: create new slide
app.post('/api/admin/heroslides', requireAdmin, async (req, res) => {
    const { title, subtitle, description, image, contextImage, cta, ctaLink, color, highlight, priceRange, status, order } = req.body;
    if (!title || !image || !cta || !ctaLink) {
        return res.status(400).json({ success: false, message: 'title, image, cta, and ctaLink are required' });
    }
    try {
        const maxOrder = await prisma.heroSlide.findFirst({ orderBy: { order: 'desc' }, select: { order: true } });
        const slide = await prisma.heroSlide.create({
            data: {
                title: String(title),
                subtitle: String(subtitle || ''),
                description: String(description || ''),
                image: String(image),
                contextImage: String(contextImage || image),
                cta: String(cta),
                ctaLink: String(ctaLink),
                color: String(color || 'from-[#0a192f] via-[#112240] to-[#1877F2]'),
                highlight: String(highlight || ''),
                priceRange: String(priceRange || ''),
                status: status === 'inactive' ? 'inactive' : 'active',
                order: order !== undefined ? Number(order) : (maxOrder ? maxOrder.order + 1 : 0),
            },
        });
        res.status(201).json({ success: true, data: slide, message: 'Hero slide created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create hero slide', error: error.message });
    }
});

// Admin: update slide
app.put('/api/admin/heroslides/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const data = {};
        const body = req.body;
        if (body.title !== undefined) data.title = String(body.title);
        if (body.subtitle !== undefined) data.subtitle = String(body.subtitle);
        if (body.description !== undefined) data.description = String(body.description);
        if (body.image !== undefined) data.image = String(body.image);
        if (body.contextImage !== undefined) data.contextImage = String(body.contextImage);
        if (body.cta !== undefined) data.cta = String(body.cta);
        if (body.ctaLink !== undefined) data.ctaLink = String(body.ctaLink);
        if (body.color !== undefined) data.color = String(body.color);
        if (body.highlight !== undefined) data.highlight = String(body.highlight);
        if (body.priceRange !== undefined) data.priceRange = String(body.priceRange);
        if (body.status !== undefined) data.status = body.status === 'inactive' ? 'inactive' : 'active';
        if (body.order !== undefined) data.order = Number(body.order);

        const slide = await prisma.heroSlide.update({ where: { id }, data });
        res.json({ success: true, data: slide, message: 'Hero slide updated' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Hero slide not found' });
        res.status(500).json({ success: false, message: 'Failed to update hero slide', error: error.message });
    }
});

// Admin: toggle active/inactive
app.patch('/api/admin/heroslides/:id/toggle', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const slide = await prisma.heroSlide.findUnique({ where: { id } });
        if (!slide) return res.status(404).json({ success: false, message: 'Hero slide not found' });
        const updated = await prisma.heroSlide.update({
            where: { id },
            data: { status: slide.status === 'active' ? 'inactive' : 'active' },
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Toggle failed', error: error.message });
    }
});

// Admin: delete slide
app.delete('/api/admin/heroslides/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.heroSlide.delete({ where: { id } });
        res.json({ success: true, message: 'Hero slide deleted' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Hero slide not found' });
        res.status(500).json({ success: false, message: 'Failed to delete hero slide', error: error.message });
    }
});

// ==================== IMAGE UPLOAD ====================

// POST /api/admin/upload — upload a single image (admin only)
app.post('/api/admin/upload', requireAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5 MB.' });
            }
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided. Send a multipart/form-data request with field name "image".' });
        }

        const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        console.log(`[UPLOAD] ✅ ${req.file.originalname} → ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
            },
        });
    });
});

// ==================== STARTUP — DB CHECK + LISTEN ====================


async function startServer() {
    // 1. Verify DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('\n  ❌ FATAL: DATABASE_URL is not set in .env');
        console.error('  → Add:  DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB_NAME?schema=public"');
        console.error('  → See backend/.env for the template.\n');
        process.exit(1);
    }

    // 2. Test DB connectivity
    try {
        await prisma.$connect();
        const count = await prisma.product.count();
        console.log(`\n  ✅ Database connected. Products in DB: ${count}`);
    } catch (err) {
        console.error('\n  ❌ Database connection FAILED:', err.message);
        console.error('  → Check that PostgreSQL is running and DATABASE_URL is correct.');
        console.error('  → Run:  npx prisma migrate dev  OR  npx prisma db push  (first time setup)');
        console.error('  → Current DATABASE_URL:', process.env.DATABASE_URL, '\n');
        process.exit(1);
    }

    // 3. Start HTTP server
    app.listen(PORT, () => {
        console.log(`\n  🚀 Elements Backend API Server v3.0 running at:`);
        console.log(`  → Local:        http://localhost:${PORT}`);
        console.log(`  → Products API: GET  http://localhost:${PORT}/api/products`);
        console.log(`  → Create Prod:  POST http://localhost:${PORT}/api/products`);
        console.log(`  → Admin Panel:  http://localhost:${PORT}/api/admin/stats`);
        console.log(`  → Staff Login:  POST http://localhost:${PORT}/api/auth/staff/login\n`);
    });
}

startServer().catch(err => {
    console.error('Startup error:', err);
    process.exit(1);
});
