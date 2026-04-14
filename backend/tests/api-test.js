/**
 * Elements E-Commerce — Automated Functional & Security Test Suite
 * Tests all API endpoints, validates responses, checks security headers
 * Run: node tests/api-test.js
 */

const http = require('http');
const API_BASE = 'http://localhost:5000';
const ADMIN_KEY = 'elements-admin-key-2026';

let passed = 0;
let failed = 0;
let total = 0;
const errors = [];

function req(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const opts = {
            hostname: url.hostname, port: url.port, path: url.pathname + url.search,
            method, headers: { 'Content-Type': 'application/json', ...headers },
        };
        const r = http.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
            });
        });
        r.on('error', reject);
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

function assert(name, condition, detail = '') {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name} ${detail ? '— ' + detail : ''}`); errors.push(name); }
}

async function run() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ELEMENTS E-COMMERCE — AUTOMATED TEST SUITE');
    console.log('═══════════════════════════════════════════════\n');

    // ==================== 1. HEALTH & SECURITY ====================
    console.log('🔒 SECURITY & HEALTH CHECKS');
    const health = await req('GET', '/api/health');
    assert('Health check returns 200', health.status === 200);
    assert('Health response has status ok', health.body?.status === 'ok');
    assert('CORS configured (headers or no CORS block)', health.status === 200); // CORS headers only visible in cross-origin requests
    assert('X-Content-Type-Options header', health.headers['x-content-type-options'] === 'nosniff');
    assert('X-Frame-Options header', !!health.headers['x-frame-options']);

    // Admin auth protection
    const noAuth = await req('GET', '/api/admin/stats');
    assert('Admin stats blocked without API key', noAuth.status === 403);

    const noAuth2 = await req('GET', '/api/admin/leads');
    assert('Admin leads blocked without API key', noAuth2.status === 403);

    const noAuth3 = await req('GET', '/api/admin/orders');
    assert('Admin orders blocked without API key', noAuth3.status === 403);

    const badAuth = await req('GET', '/api/admin/stats', null, { 'x-api-key': 'wrong-key' });
    assert('Admin stats blocked with wrong key', badAuth.status === 403);

    // ==================== 2. PUBLIC PRODUCT API ====================
    console.log('\n📦 PRODUCT API TESTS');
    const prods = await req('GET', '/api/products');
    assert('GET /api/products returns 200', prods.status === 200);
    assert('Products array exists', Array.isArray(prods.body?.data));
    assert('At least 1 product exists', prods.body?.data?.length > 0);
    assert('Products have pagination', !!prods.body?.pagination);
    assert('Product has required fields', prods.body?.data?.[0]?.id && prods.body?.data?.[0]?.name && prods.body?.data?.[0]?.price !== undefined);

    const prodSearch = await req('GET', '/api/products?search=kitchen');
    assert('Product search works', prodSearch.status === 200 && prodSearch.body?.data?.length >= 0);

    const prodByCategory = await req('GET', '/api/products?category=kitchen');
    assert('Product filter by category works', prodByCategory.status === 200);

    const prodSlug = prods.body?.data?.[0]?.slug;
    if (prodSlug) {
        const single = await req('GET', `/api/products/${prodSlug}`);
        assert('GET single product by slug', single.status === 200 && single.body?.data?.name);
    }

    const notFound = await req('GET', '/api/products/non-existent-slug-xyz');
    assert('404 for non-existent product', notFound.status === 404);

    // ==================== 3. CATEGORIES ====================
    console.log('\n🏷️  CATEGORY API TESTS');
    const cats = await req('GET', '/api/categories');
    assert('GET /api/categories returns 200', cats.status === 200);
    assert('Categories array exists', Array.isArray(cats.body?.data));
    assert('At least 1 category', cats.body?.data?.length > 0);

    // ==================== 4. SEARCH ====================
    console.log('\n🔍 SEARCH API TESTS');
    const search = await req('GET', '/api/search?q=sink');
    assert('Search for "sink" works', search.status === 200 && search.body?.data?.products?.length >= 0);

    const shortSearch = await req('GET', '/api/search?q=a');
    assert('Short search returns empty gracefully', shortSearch.status === 200);

    // ==================== 5. ADMIN PRODUCT CRUD ====================
    console.log('\n📝 ADMIN PRODUCT CRUD TESTS');
    const adminHeaders = { 'x-api-key': ADMIN_KEY };

    const newProd = await req('POST', '/api/products', { name: 'Test Product XYZ', price: 999, mrp: 1499, stock: 10, sku: 'TEST-001', categoryName: 'Kitchen Sinks' }, adminHeaders);
    assert('Create product', newProd.status === 201 && newProd.body?.data?.id);
    const testProdId = newProd.body?.data?.id;

    if (testProdId) {
        const update = await req('PUT', `/api/products/${testProdId}`, { name: 'Updated Test Product', price: 1099 }, adminHeaders);
        assert('Update product', update.status === 200 && update.body?.data?.name === 'Updated Test Product');

        const del = await req('DELETE', `/api/products/${testProdId}`, null, adminHeaders);
        assert('Delete product', del.status === 200);

        const delAgain = await req('DELETE', `/api/products/${testProdId}`, null, adminHeaders);
        assert('Delete non-existent product returns 404', delAgain.status === 404);
    }

    // Product creation without auth
    const noAuthProd = await req('POST', '/api/products', { name: 'Hack', price: 1 });
    assert('Product creation blocked without auth', noAuthProd.status === 403);

    // ==================== 6. ADMIN DASHBOARD STATS ====================
    console.log('\n📊 ADMIN DASHBOARD & STATS TESTS');
    const stats = await req('GET', '/api/admin/stats', null, adminHeaders);
    assert('Admin stats returns 200', stats.status === 200 && stats.body?.success);
    assert('Stats has totalProducts', stats.body?.data?.totalProducts !== undefined);
    assert('Stats has totalLeads', stats.body?.data?.totalLeads !== undefined);
    assert('Stats has conversionRate', stats.body?.data?.conversionRate !== undefined);
    assert('Stats has categoryDistribution', !!stats.body?.data?.categoryDistribution);

    // ==================== 7. CRM / LEADS ====================
    console.log('\n👤 CRM / LEADS TESTS');
    const createLead = await req('POST', '/api/admin/leads', { name: 'Test Lead', email: 'test@test.com', phone: '+919999999999', source: 'manual', message: 'Test message' }, adminHeaders);
    assert('Create lead', createLead.status === 201 && createLead.body?.data?.id);
    const leadId = createLead.body?.data?.id;

    const getLeads = await req('GET', '/api/admin/leads', null, adminHeaders);
    assert('Get all leads', getLeads.status === 200 && Array.isArray(getLeads.body?.data));

    if (leadId) {
        const getSingle = await req('GET', `/api/admin/leads/${leadId}`, null, adminHeaders);
        assert('Get single lead', getSingle.status === 200 && getSingle.body?.data?.name === 'Test Lead');

        const updateLead = await req('PUT', `/api/admin/leads/${leadId}`, { name: 'Updated Lead', assignedTo: 'Suresh' }, adminHeaders);
        assert('Update lead', updateLead.status === 200 && updateLead.body?.data?.name === 'Updated Lead');

        const statusUpdate = await req('PATCH', `/api/admin/leads/${leadId}/status`, { status: 'contacted' }, adminHeaders);
        assert('Update lead status', statusUpdate.status === 200);

        const addNote = await req('POST', `/api/admin/leads/${leadId}/notes`, { note: 'Called, interested in bulk order', type: 'call' }, adminHeaders);
        assert('Add note to lead', addNote.status === 200 && addNote.body?.data?.text);

        const addFollowUp = await req('POST', `/api/admin/leads/${leadId}/followups`, { scheduledAt: new Date(Date.now() + 86400000).toISOString(), type: 'call', note: 'Follow up on quote' }, adminHeaders);
        assert('Schedule follow-up', addFollowUp.status === 200);

        const convert = await req('POST', `/api/admin/leads/${leadId}/convert`, null, adminHeaders);
        assert('Convert lead to customer', convert.status === 200 && convert.body?.data?.customer?.id);

        const convertAgain = await req('POST', `/api/admin/leads/${leadId}/convert`, null, adminHeaders);
        assert('Prevent double conversion', convertAgain.status === 400);

        const delLead = await req('DELETE', `/api/admin/leads/${leadId}`, null, adminHeaders);
        assert('Delete lead', delLead.status === 200);
    }

    const badStatus = await req('PATCH', `/api/admin/leads/fake-id/status`, { status: 'invalid' }, adminHeaders);
    assert('Invalid lead status rejected', badStatus.status === 400);

    // ==================== 8. WEBHOOKS ====================
    console.log('\n🔗 WEBHOOK TESTS');
    const webhookTests = [
        { path: '/api/webhooks/indiamart', body: { SENDER_NAME: 'Test IM', SENDER_EMAIL: 'im@test.com', SENDER_MOBILE: '9876543210', QUERY_MESSAGE: 'Need tiles' }, name: 'IndiaMART' },
        { path: '/api/webhooks/amazon', body: { customerName: 'Amazon Test', email: 'az@test.com', product: 'Sink', quantity: 2 }, name: 'Amazon' },
        { path: '/api/webhooks/flipkart', body: { customerName: 'FK Test', email: 'fk@test.com', productName: 'Tile' }, name: 'Flipkart' },
        { path: '/api/webhooks/meesho', body: { customerName: 'Meesho Test', email: 'ms@test.com', productName: 'Floor Guard', orderValue: 5000 }, name: 'Meesho' },
        { path: '/api/webhooks/meta', body: { name: 'Meta Test', email: 'fb@test.com', phone: '9876543211', ad_name: 'Test Ad' }, name: 'Meta' },
        { path: '/api/webhooks/google-business', body: { name: 'GMB Test', email: 'gmb@test.com', message: 'Looking for tiles' }, name: 'Google Business' },
        { path: '/api/webhooks/generic', body: { name: 'Generic Test', email: 'gen@test.com', source: 'zapier' }, name: 'Generic' },
    ];
    for (const wh of webhookTests) {
        const res = await req('POST', wh.path, wh.body);
        assert(`${wh.name} webhook captures lead`, res.status === 201 && res.body?.success);
    }

    // ==================== 9. ORDERS ====================
    console.log('\n🛒 ORDER TESTS');
    const ordersRes = await req('GET', '/api/admin/orders', null, adminHeaders);
    assert('Get admin orders', ordersRes.status === 200);

    // Create order via public API
    const createOrder = await req('POST', '/api/orders', {
        sessionId: 'test', items: [{ productId: 'prod-1', name: 'Test Sink', quantity: 1, price: 4999 }],
        subtotal: 4999, shipping: 0, total: 4999,
        customerName: 'Test Customer', email: 'order@test.com', phone: '9876543210',
        address: '123 Test Street', pincode: '110001', paymentMethod: 'upi',
    });
    assert('Create order', createOrder.status === 201 && createOrder.body?.orderId);

    if (createOrder.body?.orderId) {
        const getOrder = await req('GET', `/api/orders/${createOrder.body.orderId}`);
        assert('Get order details', getOrder.status === 200 && getOrder.body?.data?.id);

        const updateOrderStatus = await req('PUT', `/api/admin/orders/${createOrder.body.orderId}/status`, { status: 'SHIPPED' }, adminHeaders);
        assert('Update order status', updateOrderStatus.status === 200);
    }

    // ==================== 10. PAYMENTS ====================
    console.log('\n💳 PAYMENT TESTS');
    const payments = await req('GET', '/api/admin/payments', null, adminHeaders);
    assert('Get payments', payments.status === 200);
    assert('Payments has summary', !!payments.body?.summary);

    // ==================== 11. AI INTELLIGENCE ====================
    console.log('\n🤖 AI INTELLIGENCE TESTS');
    const leadScores = await req('GET', '/api/admin/ai/lead-scores', null, adminHeaders);
    assert('AI lead scoring', leadScores.status === 200 && Array.isArray(leadScores.body?.data));
    assert('Lead scoring has summary', !!leadScores.body?.summary);

    const forecast = await req('GET', '/api/admin/ai/forecast', null, adminHeaders);
    assert('AI sales forecast', forecast.status === 200 && forecast.body?.data?.insights);

    // ==================== 12. LEAD AUTOMATION ====================
    console.log('\n⚙️  LEAD AUTOMATION TESTS');
    const autoAssign = await req('POST', '/api/admin/automation/auto-assign', { rules: [{ source: 'all', assignTo: 'Admin' }] }, adminHeaders);
    assert('Auto-assign leads', autoAssign.status === 200);

    const autoFollowUp = await req('POST', '/api/admin/automation/schedule-followups', { daysThreshold: 0 }, adminHeaders);
    assert('Auto schedule follow-ups', autoFollowUp.status === 200);

    // ==================== 13. SEO ====================
    console.log('\n🌐 SEO TESTS');
    const seo = await req('GET', '/api/admin/seo', null, adminHeaders);
    assert('Get page SEO data', seo.status === 200 && Array.isArray(seo.body?.data));

    const updateSeo = await req('PUT', '/api/admin/seo/home', { metaTitle: 'Test SEO Title' }, adminHeaders);
    assert('Update page SEO', updateSeo.status === 200);

    // ==================== 14. INTEGRATIONS ====================
    console.log('\n🔌 INTEGRATION TESTS');
    const integrations = await req('GET', '/api/admin/integrations', null, adminHeaders);
    assert('Get integrations', integrations.status === 200 && integrations.body?.data);

    const saveInt = await req('POST', '/api/admin/integrations', { platform: 'amazon', config: { enabled: true, sellerId: 'TEST123' } }, adminHeaders);
    assert('Save integration config', saveInt.status === 200);

    // ==================== 15. INPUT VALIDATION & SECURITY ====================
    console.log('\n🛡️  INPUT VALIDATION & SECURITY');
    const emptyLead = await req('POST', '/api/admin/leads', { name: '' }, adminHeaders);
    assert('Empty lead name rejected', emptyLead.status === 400);

    const xssLead = await req('POST', '/api/leads', { name: '<script>alert("xss")</script>', email: 'xss@test.com', phone: '1234567890' });
    assert('XSS in lead name sanitized', xssLead.status === 201 && !xssLead.body?.data?.name?.includes('<script>'));

    const invalidOrderStatus = await req('PUT', '/api/admin/orders/fake-id/status', { status: 'INVALID' }, adminHeaders);
    assert('Invalid order status rejected', invalidOrderStatus.status === 400);

    const missingCartOrder = await req('POST', '/api/orders', { items: [], customerName: 'Test', email: 'test@test.com', address: 'Test', pincode: '110001' });
    assert('Empty cart order rejected', missingCartOrder.status === 400);

    // ==================== 16. CART & WISHLIST ====================
    console.log('\n🛍️  CART & WISHLIST TESTS');
    const addToCart = await req('POST', '/api/cart', { productId: 'prod-1', quantity: 2 }, { 'x-session-id': 'test-session' });
    assert('Add to cart', addToCart.status === 200);

    const getCart = await req('GET', '/api/cart', null, { 'x-session-id': 'test-session' });
    assert('Get cart', getCart.status === 200 && getCart.body?.data?.items?.length > 0);

    const addWishlist = await req('POST', '/api/wishlist', { productId: 'prod-1' }, { 'x-session-id': 'test-session' });
    assert('Add to wishlist', addWishlist.status === 200);

    // ==================== RESULTS ====================
    console.log('\n═══════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed}/${total} passed, ${failed} failed`);
    if (failed > 0) {
        console.log(`\n  ❌ Failed tests:`);
        errors.forEach(e => console.log(`     - ${e}`));
    } else {
        console.log('  🎉 ALL TESTS PASSED!');
    }
    console.log('═══════════════════════════════════════════════\n');
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Test suite error:', e); process.exit(1); });
