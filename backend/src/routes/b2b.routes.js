/**
 * B2B (Business-to-Business) API Routes
 * ======================================
 * Machine-to-machine endpoints secured with API keys.
 *
 * Authentication: Pass the API key as a request header:
 *   X-API-Key: <your-key>
 *
 * Keys are configured via the B2B_API_KEYS environment variable
 * as a comma-separated list of valid keys, e.g.:
 *   B2B_API_KEYS=key1,key2,key3
 *
 * ── EXPOSED endpoints (B2B consumers call these) ──────────────────────────
 *  Catalogue
 *   GET  /api/b2b/pets                         - paginated pet catalogue
 *   GET  /api/b2b/products                     - paginated product catalogue
 *   GET  /api/b2b/services                     - approved service providers
 *   GET  /api/b2b/stats                        - platform statistics
 *
 *  Seller / Order Management
 *   GET  /api/b2b/orders                       - seller's orders for fulfillment
 *   PUT  /api/b2b/orders/:orderNumber/tracking - update shipping tracking & status
 *   POST /api/b2b/webhooks/delivery-status     - courier webhook: auto-update delivery
 *
 *  Inventory
 *   GET  /api/b2b/inventory                    - product stock levels for a seller
 *
 *  Service Provider Availability
 *   GET  /api/b2b/providers/availability       - booked slots for partner booking platforms
 *
 *  Events
 *   GET  /api/b2b/events                       - upcoming event catalogue
 *   POST /api/b2b/events/:id/bulk-register     - bulk attendee registration
 *
 * ── CONSUMED external APIs (PetVerse calls these) ─────────────────────────
 *   GET /api/b2b/external/dog-breeds           - dog.ceo breed list
 *   GET /api/b2b/external/cat-facts            - catfact.ninja random facts
 *   GET /api/b2b/external/breed-info           - TheDogAPI breed standards
 */

const express = require('express');
const router = express.Router();
const https = require('https');

const Pet     = require('../models/pets');
const Product = require('../models/products');
const User    = require('../models/users');
const Order   = require('../models/order');
const Event   = require('../models/event');
const Booking = require('../models/Booking');

// ── API-key authentication middleware ────────────────────────────────────────

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: X-API-Key
 */
function b2bAuth(req, res, next) {
    const providedKey = req.headers['x-api-key'];
    if (!providedKey) {
        return res.status(401).json({
            success: false,
            error: 'Missing API key',
            hint: 'Provide your key in the X-API-Key request header'
        });
    }

    const rawKeys = process.env.B2B_API_KEYS || '';
    const validKeys = rawKeys
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

    if (validKeys.length === 0) {
        // No keys configured — reject all requests in production; allow in dev for convenience
        if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
                success: false,
                error: 'B2B API not configured on this server'
            });
        }
        // Dev mode: accept any non-empty key
        return next();
    }

    if (!validKeys.includes(providedKey)) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key'
        });
    }

    next();
}

// ── Utility: fetch from an external HTTPS URL ─────────────────────────────────

function fetchExternalJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Failed to parse external JSON')); }
            });
        }).on('error', reject);
    });
}

// ════════════════════════════════════════════════════════════════════════════
//  EXPOSED B2B ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/pets:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Get paginated pet catalogue"
 *     description: Machine-to-machine endpoint for partner platforms to retrieve available pets.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Dog | Cat | Bird | Fish | Other
 *     responses:
 *       200:
 *         description: Paginated pet list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     pets: { type: array }
 *                     pagination: { type: object }
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/pets', b2bAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const query = { available: true };
        if (category) query.category = category;

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Pet.countDocuments(query);
        const pets  = await Pet.find(query)
            .select('-images.data')   // exclude binary blobs
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const petsOut = pets.map(p => ({
            id:          p._id,
            name:        p.name,
            category:    p.category,
            breed:       p.breed,
            age:         p.age,
            gender:      p.gender,
            price:       p.price,
            description: p.description,
            available:   p.available,
            imageUrls:   (p.images || []).map(img => img.url).filter(Boolean),
            listedAt:    p.createdAt
        }));

        res.json({
            success: true,
            data: {
                pets: petsOut,
                pagination: {
                    total,
                    page:       parseInt(page),
                    limit:      parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/b2b/products:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Get paginated product catalogue"
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated product list
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/products', b2bAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const query = { isActive: true };
        if (category) query.category = category;

        const skip     = (parseInt(page) - 1) * parseInt(limit);
        const total    = await Product.countDocuments(query);
        const products = await Product.find(query)
            .select('-images.data')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const productsOut = products.map(p => ({
            id:          p._id,
            name:        p.name,
            category:    p.category,
            brand:       p.brand,
            price:       p.price,
            discount:    p.discount,
            stock:       p.stock,
            description: p.description,
            avgRating:   p.avgRating,
            imageUrls:   (p.images || []).map(img => img.url).filter(Boolean),
            listedAt:    p.createdAt
        }));

        res.json({
            success: true,
            data: {
                products: productsOut,
                pagination: {
                    total,
                    page:       parseInt(page),
                    limit:      parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/b2b/services:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Get list of approved service providers"
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema: { type: string }
 *         description: "veterinarian | groomer | trainer | pet sitter | breeder"
 *     responses:
 *       200:
 *         description: Service provider list
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/services', b2bAuth, async (req, res) => {
    try {
        const { serviceType } = req.query;
        const query = { role: 'service_provider', isApproved: true };
        if (serviceType) query.serviceType = new RegExp(serviceType, 'i');

        const providers = await User.find(query)
            .select('fullName username serviceType serviceAddress phoneNo createdAt')
            .lean();

        const providersOut = providers.map(p => ({
            id:             p._id,
            name:           p.fullName || p.username,
            serviceType:    p.serviceType,
            serviceAddress: p.serviceAddress,
            phone:          p.phoneNo,
            joinedAt:       p.createdAt
        }));

        res.json({ success: true, data: { services: providersOut, total: providersOut.length } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/b2b/stats:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Get platform statistics"
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Platform stats
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/stats', b2bAuth, async (req, res) => {
    try {
        const [totalPets, totalProducts, totalProviders, totalUsers] = await Promise.all([
            Pet.countDocuments({ available: true }),
            Product.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'service_provider', isApproved: true }),
            User.countDocuments({ role: 'owner' })
        ]);

        res.json({
            success: true,
            data: {
                availablePets:      totalPets,
                activeProducts:     totalProducts,
                serviceProviders:   totalProviders,
                registeredPetOwners: totalUsers,
                generatedAt:        new Date().toISOString()
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  CONSUMED EXTERNAL APIs
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/external/dog-breeds:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Consume dog.ceo API — list all dog breeds"
 *     description: Demonstrates B2B API consumption. Fetches breed data from the public dog.ceo/api service.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Dog breed data from dog.ceo
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/external/dog-breeds', b2bAuth, async (req, res) => {
    try {
        const data = await fetchExternalJson('https://dog.ceo/api/breeds/list/all');
        res.json({
            success: true,
            source:  'dog.ceo',
            data
        });
    } catch (err) {
        res.status(502).json({
            success: false,
            error:   'Failed to fetch from external API',
            detail:  err.message
        });
    }
});

/**
 * @swagger
 * /api/b2b/external/cat-facts:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Consume catfact.ninja API — random cat facts"
 *     description: Demonstrates B2B API consumption. Fetches cat facts from the public catfact.ninja service.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema: { type: integer, default: 5 }
 *         description: Number of facts to return (max 50)
 *     responses:
 *       200:
 *         description: Cat facts from catfact.ninja
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/external/cat-facts', b2bAuth, async (req, res) => {
    try {
        const count = Math.min(parseInt(req.query.count) || 5, 50);
        const data  = await fetchExternalJson(`https://catfact.ninja/facts?limit=${count}`);
        res.json({
            success: true,
            source:  'catfact.ninja',
            data
        });
    } catch (err) {
        res.status(502).json({
            success: false,
            error:   'Failed to fetch from external API',
            detail:  err.message
        });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  SELLER — ORDER MANAGEMENT (EXPOSE)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/orders:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Seller — fetch orders for fulfillment"
 *     description: |
 *       Returns paginated orders belonging to the specified seller, sorted by newest first.
 *       Use `status` to filter by fulfillment stage. Intended for ERP / logistics integrations.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the seller
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, completed, cancelled]
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "ISO 8601 start date filter (e.g. 2024-01-01)"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated order list for the seller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders: { type: array }
 *                     pagination: { type: object }
 *       400:
 *         description: Missing sellerId
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 */
router.get('/orders', b2bAuth, async (req, res) => {
    const { sellerId, status, from, to, page = 1, limit = 20 } = req.query;
    if (!sellerId) return res.status(400).json({ success: false, error: 'sellerId query param is required' });

    const filter = { seller: sellerId };
    if (status) filter.status = status;
    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to)   filter.createdAt.$lte = new Date(to);
    }

    try {
        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('customer', 'fullName email phoneNo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const ordersOut = orders.map(o => ({
            orderNumber:     o.orderNumber,
            status:          o.status,
            paymentStatus:   o.paymentStatus,
            totalAmount:     o.totalAmount,
            items:           o.items.map(i => ({ product: i.product, qty: i.quantity, price: i.price })),
            customer:        { name: o.customer?.fullName, email: o.customer?.email, phone: o.customer?.phoneNo },
            shippingAddress: o.shippingAddress,
            trackingNumber:  o.trackingNumber || null,
            placedAt:        o.createdAt,
            lastUpdated:     o.updatedAt
        }));

        res.json({
            success: true,
            data: { orders: ordersOut, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/b2b/orders/{orderNumber}/tracking:
 *   put:
 *     tags: [B2B]
 *     summary: "[B2B] Seller — update order tracking number and status"
 *     description: |
 *       Called by seller ERP or logistics partner to push shipping tracking info back into PetVerse.
 *       Appends a new entry to `statusHistory` and updates the top-level status field.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *         description: "e.g. ORD1718093400001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, sellerId]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, shipped, delivered, completed, cancelled]
 *               sellerId:
 *                 type: string
 *                 description: Seller ObjectId (proves ownership)
 *               trackingNumber:
 *                 type: string
 *                 description: Courier AWB / tracking number
 *               courierName:
 *                 type: string
 *                 description: "e.g. Delhivery, BlueDart, India Post"
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Missing required fields or invalid status transition
 *       404:
 *         description: Order not found or does not belong to this seller
 */
router.put('/orders/:orderNumber/tracking', b2bAuth, async (req, res) => {
    const { orderNumber } = req.params;
    const { status, sellerId, trackingNumber, courierName, notes } = req.body;

    if (!sellerId || !status) {
        return res.status(400).json({ success: false, error: 'sellerId and status are required in the request body' });
    }

    const allowedTransitions = {
        pending:    ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped:    ['delivered'],
        delivered:  ['completed']
    };

    try {
        const order = await Order.findOne({ orderNumber, seller: sellerId });
        if (!order) return res.status(404).json({ success: false, error: 'Order not found or does not belong to seller' });

        const allowed = allowedTransitions[order.status] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot transition from '${order.status}' to '${status}'`,
                allowedNext: allowed
            });
        }

        order.status = status;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (courierName)    order.courierName    = courierName;
        order.statusHistory.push({
            status,
            updatedBy:     sellerId,
            updatedByRole: 'seller',
            notes:         notes || `Status updated via B2B API${trackingNumber ? ` · AWB: ${trackingNumber}` : ''}`
        });

        await order.save();
        res.json({ success: true, message: 'Order status updated', orderNumber, newStatus: status, trackingNumber: order.trackingNumber });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  COURIER INTEGRATION — DELIVERY WEBHOOK (EXPOSE — receive from courier)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/webhooks/delivery-status:
 *   post:
 *     tags: [B2B]
 *     summary: "[B2B] Webhook — courier delivery status update"
 *     description: |
 *       Endpoint for courier partners (Delhivery, BlueDart, etc.) to POST real-time delivery events
 *       into PetVerse. Automatically marks orders as `delivered` or `cancelled` based on the event.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderNumber, event]
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 description: PetVerse order number
 *               trackingNumber:
 *                 type: string
 *                 description: Courier AWB
 *               event:
 *                 type: string
 *                 enum: [DELIVERED, FAILED_DELIVERY, RETURNED, OUT_FOR_DELIVERY]
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Missing orderNumber or event
 *       404:
 *         description: Order not found
 */
router.post('/webhooks/delivery-status', b2bAuth, async (req, res) => {
    const { orderNumber, trackingNumber, event, timestamp, remarks } = req.body;
    if (!orderNumber || !event) {
        return res.status(400).json({ success: false, error: 'orderNumber and event are required' });
    }

    const eventToStatus = {
        DELIVERED:        'delivered',
        FAILED_DELIVERY:  null,          // no status change, just note
        RETURNED:         'cancelled',
        OUT_FOR_DELIVERY: null           // informational only
    };

    if (!eventToStatus.hasOwnProperty(event)) {
        return res.status(400).json({ success: false, error: 'Unknown event type', valid: Object.keys(eventToStatus) });
    }

    try {
        const order = await Order.findOne({ orderNumber });
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

        const newStatus = eventToStatus[event];
        const note = `[Courier Webhook] ${event}${trackingNumber ? ` · AWB: ${trackingNumber}` : ''}${remarks ? ` · ${remarks}` : ''}`;

        order.statusHistory.push({
            status:        newStatus || order.status,
            updatedBy:     order.seller,
            updatedByRole: 'system',
            notes:         note
        });

        if (newStatus && newStatus !== order.status) {
            order.status = newStatus;
        }
        if (trackingNumber) order.trackingNumber = trackingNumber;

        await order.save();
        res.json({ success: true, message: 'Delivery event recorded', orderNumber, event, statusNow: order.status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  SELLER — INVENTORY (EXPOSE)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/inventory:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Seller — product inventory / stock levels"
 *     description: |
 *       Returns current stock quantities for all products belonging to the seller.
 *       Filter by `lowStock=true` to see only items at or below reorder threshold (default: 10 units).
 *       Intended for warehouse management or inventory sync integrations.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *         description: "If true, returns only items with stock ≤ threshold"
 *       - in: query
 *         name: threshold
 *         schema: { type: integer, default: 10 }
 *         description: Low-stock threshold (units)
 *     responses:
 *       200:
 *         description: Inventory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     inventory: { type: array }
 *                     lowStockCount: { type: integer }
 *                     totalSKUs: { type: integer }
 *       400:
 *         description: Missing sellerId
 */
router.get('/inventory', b2bAuth, async (req, res) => {
    const { sellerId, lowStock, threshold = 10 } = req.query;
    if (!sellerId) return res.status(400).json({ success: false, error: 'sellerId query param is required' });

    try {
        const filter = { seller: sellerId, isActive: true };
        if (lowStock === 'true') filter.stock = { $lte: parseInt(threshold) };

        const products = await Product.find(filter)
            .select('name category brand stock price discount isActive updatedAt')
            .sort({ stock: 1 })
            .lean();

        const inventory = products.map(p => ({
            sku:        p._id,
            name:       p.name,
            category:   p.category,
            brand:      p.brand,
            stock:      p.stock,
            price:      p.price,
            isLowStock: p.stock <= parseInt(threshold),
            lastUpdated: p.updatedAt
        }));

        const lowStockCount = inventory.filter(i => i.isLowStock).length;

        res.json({ success: true, data: { inventory, totalSKUs: inventory.length, lowStockCount, threshold: parseInt(threshold) } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  SERVICE PROVIDERS — AVAILABILITY (EXPOSE)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/providers/availability:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Service provider — slot availability for booking platforms"
 *     description: |
 *       Returns upcoming booked slots for a service provider, allowing partner booking platforms
 *       to query availability before making reservations. Dates are in ISO 8601 format.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: "Start of date range (defaults to today)"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: "End of date range (defaults to 30 days from now)"
 *     responses:
 *       200:
 *         description: Slot availability data
 *       400:
 *         description: Missing providerId
 */
router.get('/providers/availability', b2bAuth, async (req, res) => {
    const { providerId, from, to } = req.query;
    if (!providerId) return res.status(400).json({ success: false, error: 'providerId query param is required' });

    const fromDate = from ? new Date(from) : new Date();
    const toDate   = to   ? new Date(to)   : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
        const provider = await User.findOne({ _id: providerId, role: 'service_provider' })
            .select('fullName serviceType serviceAddress')
            .lean();
        if (!provider) return res.status(404).json({ success: false, error: 'Service provider not found' });

        const bookings = await Booking.find({
            service: providerId,
            date: { $gte: fromDate, $lte: toDate }
        }).select('date slot').sort({ date: 1 }).lean();

        // Group booked slots by date
        const bookedByDate = {};
        bookings.forEach(b => {
            const d = new Date(b.date).toISOString().slice(0, 10);
            if (!bookedByDate[d]) bookedByDate[d] = [];
            bookedByDate[d].push(b.slot);
        });

        res.json({
            success: true,
            data: {
                provider: { id: provider._id, name: provider.fullName, serviceType: provider.serviceType, location: provider.serviceAddress },
                range: { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) },
                bookedSlots: bookedByDate,
                totalBookings: bookings.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  EVENTS — CATALOGUE & BULK REGISTRATION (EXPOSE)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/events:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Upcoming event catalogue for partner aggregators"
 *     description: Returns upcoming events with capacity info for event listing platforms or ticketing partners.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Workshop, "Adoption Drive", "Pet Show", Competition] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Upcoming events with availability
 */
router.get('/events', b2bAuth, async (req, res) => {
    const { city, category, from, page = 1, limit = 20 } = req.query;

    const filter = { status: 'upcoming', eventDate: { $gte: from ? new Date(from) : new Date() } };
    if (category) filter.category = category;
    if (city)     filter['location.city'] = new RegExp(city, 'i');

    try {
        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Event.countDocuments(filter);
        const events = await Event.find(filter)
            .populate('organizer', 'fullName email')
            .sort({ eventDate: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const eventsOut = events.map(e => ({
            id:             e._id,
            title:          e.title,
            category:       e.category,
            eventDate:      e.eventDate,
            startTime:      e.startTime,
            location:       e.location,
            entryFee:       e.entryFee,
            maxAttendees:   e.maxAttendees,
            registeredCount: e.attendees?.length || 0,
            availableSpots: e.maxAttendees - (e.attendees?.length || 0),
            isSoldOut:      (e.attendees?.length || 0) >= e.maxAttendees,
            organizer:      { name: e.organizer?.fullName, contact: e.contactEmail || e.organizer?.email },
            tags:           e.tags
        }));

        res.json({
            success: true,
            data: { events: eventsOut, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/b2b/events/{eventId}/bulk-register:
 *   post:
 *     tags: [B2B]
 *     summary: "[B2B] Bulk-register attendees via a partner ticketing platform"
 *     description: |
 *       Allows an authorized partner platform (e.g., BookMyShow, Eventbrite-like integrations)
 *       to register multiple attendees in a single API call. Returns per-attendee success/failure.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attendees]
 *             properties:
 *               attendees:
 *                 type: array
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required: [userId]
 *                   properties:
 *                     userId:
 *                       type: string
 *                     numberOfPets:
 *                       type: integer
 *                       default: 1
 *                     specialRequirements:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk registration result with per-attendee status
 *       400:
 *         description: Missing attendees or event full
 *       404:
 *         description: Event not found
 */
router.post('/events/:eventId/bulk-register', b2bAuth, async (req, res) => {
    const { eventId } = req.params;
    const { attendees } = req.body;

    if (!Array.isArray(attendees) || attendees.length === 0) {
        return res.status(400).json({ success: false, error: 'attendees array is required and must not be empty' });
    }
    if (attendees.length > 50) {
        return res.status(400).json({ success: false, error: 'Maximum 50 attendees per bulk-register call' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
        if (event.status !== 'upcoming') return res.status(400).json({ success: false, error: 'Event is not accepting registrations' });

        const availableSpots = event.maxAttendees - event.attendees.length;
        if (availableSpots <= 0) return res.status(400).json({ success: false, error: 'Event is fully booked' });

        const results = [];
        let registered = 0;

        for (const att of attendees) {
            if (!att.userId) { results.push({ userId: att.userId, status: 'FAILED', reason: 'Missing userId' }); continue; }
            if (registered >= availableSpots) { results.push({ userId: att.userId, status: 'FAILED', reason: 'Event capacity reached' }); continue; }

            const alreadyRegistered = event.attendees.some(a => a.user?.toString() === att.userId);
            if (alreadyRegistered) { results.push({ userId: att.userId, status: 'SKIPPED', reason: 'Already registered' }); continue; }

            event.attendees.push({
                user:                att.userId,
                isPaid:              event.entryFee === 0,
                numberOfPets:        att.numberOfPets || 1,
                specialRequirements: att.specialRequirements || ''
            });
            results.push({ userId: att.userId, status: 'REGISTERED' });
            registered++;
        }

        if (registered > 0) await event.save();

        res.json({
            success: true,
            data: {
                eventId, registered, skipped: results.filter(r => r.status === 'SKIPPED').length,
                failed: results.filter(r => r.status === 'FAILED').length,
                results,
                remainingSpots: event.maxAttendees - event.attendees.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  CONSUME EXTERNAL — BREED INFO (TheDogAPI)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/b2b/external/breed-info:
 *   get:
 *     tags: [B2B]
 *     summary: "[B2B] Consume TheDogAPI — breed standards and characteristics"
 *     description: |
 *       Fetches standardized breed information from TheDogAPI (thedogapi.com).
 *       Useful for validating pet listing data, displaying breed health info, or vet reference lookups.
 *       Results include temperament, lifespan, weight, and breed group.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: breed
 *         schema: { type: string }
 *         description: "Filter by breed name (partial match), e.g. 'labrador'"
 *     responses:
 *       200:
 *         description: Breed info from TheDogAPI
 *       502:
 *         description: External API unreachable
 */
router.get('/external/breed-info', b2bAuth, async (req, res) => {
    const { breed } = req.query;
    const url = breed
        ? `https://api.thedogapi.com/v1/breeds/search?q=${encodeURIComponent(breed)}`
        : 'https://api.thedogapi.com/v1/breeds?limit=20';
    try {
        const data = await fetchExternalJson(url);
        const breeds = Array.isArray(data) ? data.map(b => ({
            id:          b.id,
            name:        b.name,
            breedGroup:  b.breed_group,
            temperament: b.temperament,
            lifeSpan:    b.life_span,
            weight:      b.weight,
            height:      b.height,
            origin:      b.origin,
            bredFor:     b.bred_for
        })) : data;
        res.json({ success: true, source: 'thedogapi.com', count: Array.isArray(breeds) ? breeds.length : 1, data: breeds });
    } catch (err) {
        res.status(502).json({ success: false, error: 'Failed to fetch from TheDogAPI', detail: err.message });
    }
});

module.exports = router;
