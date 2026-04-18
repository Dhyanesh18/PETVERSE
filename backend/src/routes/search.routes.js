/**
 * Search routes — powered by Typesense
 * =====================================
 * Primary:  Typesense multi_search (typo-tolerant, prefix-aware, relevance-scored).
 * Fallback: MongoDB $text / regex (when Typesense is unavailable).
 *
 * GET /api/search                 — global search across all collections
 * GET /api/search/suggestions     — autocomplete (≤10 mixed results)
 * GET /api/search/quick           — alias → /suggestions (backward compat)
 * GET /api/search/:category       — paginated single-collection search
 */

const express = require('express');
const router  = express.Router();

const Pet     = require('../models/pets');
const Product = require('../models/products');
const User    = require('../models/users');
const Event   = require('../models/event');
const PetMate = require('../models/petMate');
const { cacheGet, cacheSet } = require('../utils/redis');
const { multiSearch, isTypesenseReady } = require('../utils/typesense');

// ── MongoDB fallback ──────────────────────────────────────────────────────────
// Used when Typesense is unavailable. Mirrors the Typesense output shape.

function buildTextQuery(q, baseFilter = {}) {
    const trimmed = q.trim();
    if (trimmed.length >= 3) {
        return { filter: { ...baseFilter, $text: { $search: trimmed } }, projection: { score: { $meta: 'textScore' } }, sort: { score: { $meta: 'textScore' } }, usedText: true };
    }
    const regex = new RegExp('^' + trimmed, 'i');
    return { filter: { ...baseFilter }, regex, projection: {}, sort: { createdAt: -1 }, usedText: false };
}

async function mongoFallback(query, limit = 10, exclude = []) {
    const results  = {};
    const promises = [];

    if (!exclude.includes('pets')) {
        const t = buildTextQuery(query, { available: true });
        const f = t.usedText ? t.filter : { ...t.filter, $or: [{ name: t.regex }, { breed: t.regex }, { category: t.regex }] };
        promises.push(Pet.find(f, t.projection).sort(t.sort).limit(limit).lean().then(docs => {
            results.pets = docs.map(p => ({ id: p._id, name: p.name, breed: p.breed, category: p.category, price: p.price, gender: p.gender, thumbnail: p.images?.[0]?.url || null, type: 'pet', url: `/pets/${p._id}`, score: p.score }));
        }));
    }
    if (!exclude.includes('products')) {
        const t = buildTextQuery(query, { isActive: true });
        const f = t.usedText ? t.filter : { ...t.filter, $or: [{ name: t.regex }, { brand: t.regex }, { category: t.regex }] };
        promises.push(Product.find(f, t.projection).sort(t.sort).limit(limit).lean().then(docs => {
            results.products = docs.map(p => ({ id: p._id, name: p.name, brand: p.brand, category: p.category, price: p.price, discount: p.discount, stock: p.stock, thumbnail: p.images?.[0]?.url || null, type: 'product', url: `/products/${p._id}`, score: p.score }));
        }));
    }
    if (!exclude.includes('services')) {
        const rx = new RegExp(query.trim(), 'i');
        promises.push(User.find({ role: 'service_provider', isApproved: true, $or: [{ fullName: rx }, { serviceType: rx }, { serviceAddress: rx }] }).select('fullName serviceType serviceAddress').limit(limit).lean().then(docs => {
            results.services = docs.map(s => ({ id: s._id, name: s.fullName, serviceType: s.serviceType, address: s.serviceAddress, type: 'service', url: `/services/${s._id}` }));
        }));
    }
    if (!exclude.includes('events')) {
        const t = buildTextQuery(query, { eventDate: { $gte: new Date() }, status: 'upcoming' });
        const f = t.usedText ? t.filter : { ...t.filter, $or: [{ title: t.regex }, { description: t.regex }] };
        promises.push(Event.find(f, t.projection).sort(t.sort).limit(limit).lean().then(docs => {
            results.events = docs.map(e => ({ id: e._id, title: e.title, category: e.category, eventDate: e.eventDate, city: e.location?.city, entryFee: e.entryFee, availableSlots: (e.maxAttendees || 0) - (e.attendees?.length || 0), thumbnail: e.images?.[0]?.url || null, type: 'event', url: `/events/${e._id}`, score: e.score }));
        }));
    }
    if (!exclude.includes('mates')) {
        const rx = new RegExp(query.trim(), 'i');
        promises.push(PetMate.find({ $or: [{ name: rx }, { breed: rx }, { petType: rx }] }).limit(limit).lean().then(docs => {
            results.mates = docs.map(m => ({ id: m._id, name: m.name, breed: m.breed, petType: m.petType, gender: m.gender, thumbnail: m.images?.[0]?.url || null, type: 'mate', url: `/mate/${m._id}` }));
        }));
    }

    await Promise.all(promises);
    return results;
}

// ── Core search dispatcher ────────────────────────────────────────────────────

async function search(query, collections, limit) {
    if (isTypesenseReady()) {
        try {
            return await multiSearch(query, collections, limit);
        } catch (err) {
            console.warn('[Search] Typesense error, falling back to MongoDB:', err.message);
        }
    }
    const all     = ['pets', 'products', 'services', 'events', 'mates'];
    const exclude = all.filter(c => !collections.includes(c));
    return mongoFallback(query, limit, exclude);
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Global full-text search across all collections
 *     description: |
 *       Primary engine: **Typesense** (typo-tolerant, prefix-aware, relevance-scored).
 *       Automatic fallback to MongoDB `$text` when Typesense is unavailable.
 *       Results cached in Redis for 60 s. Response includes `engine` field indicating which backend was used.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Max results per category
 *       - in: query
 *         name: exclude
 *         schema: { type: string }
 *         description: Comma-separated categories to skip (pets,products,services,events,mates)
 *     responses:
 *       200:
 *         description: Search results grouped by category
 *         headers:
 *           X-Cache:
 *             schema: { type: string, enum: [HIT, MISS] }
 *           X-Search-Engine:
 *             schema: { type: string, enum: [typesense, mongodb] }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:        { type: string }
 *                     engine:       { type: string, enum: [typesense, mongodb] }
 *                     pets:         { type: array }
 *                     products:     { type: array }
 *                     services:     { type: array }
 *                     events:       { type: array }
 *                     mates:        { type: array }
 *                     totalResults: { type: integer }
 *                     resultCounts: { type: object }
 */
router.get('/', async (req, res) => {
    const { q, term, limit = 10, exclude } = req.query;
    const query = (q || term || '').trim();

    if (!query) {
        return res.json({ success: true, data: { query: '', pets: [], products: [], services: [], events: [], mates: [], totalResults: 0 } });
    }

    const engine   = isTypesenseReady() ? 'typesense' : 'mongodb';
    const cacheKey = `search:${Buffer.from(query + ':' + (exclude || '')).toString('base64')}`;

    try {
        const cached = await cacheGet(cacheKey);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Search-Engine', cached.data?.engine || engine);
            return res.json(cached);
        }
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Search-Engine', engine);

        const excludeArray = exclude ? exclude.split(',') : [];
        const all          = ['pets', 'products', 'services', 'events', 'mates'];
        const collections  = all.filter(c => !excludeArray.includes(c));
        const results      = await search(query, collections, parseInt(limit));

        all.forEach(c => { if (!results[c]) results[c] = []; });

        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        const body = {
            success: true,
            data: { query, engine, ...results, totalResults, resultCounts: Object.fromEntries(all.map(c => [c, results[c]?.length || 0])) }
        };
        await cacheSet(cacheKey, body, 60);
        return res.json(body);
    } catch (err) {
        console.error('[Search] Error:', err);
        res.status(500).json({ success: false, error: 'Search failed', message: err.message });
    }
});

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Autocomplete suggestions for the search bar (≤10 results)
 *     description: Returns up to 3 results per category mixed together. Cached 30 s. Minimum 2 characters.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Partial query (min 2 chars)
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:       { type: string }
 *                     suggestions: { type: array }
 *                     hasMore:     { type: boolean }
 */
router.get('/suggestions', async (req, res) => {
    const { q, term } = req.query;
    const query = (q || term || '').trim();

    if (query.length < 2) {
        return res.json({ success: true, data: { query, suggestions: [] } });
    }

    const cacheKey = `suggest:${Buffer.from(query).toString('base64')}`;
    try {
        const cached = await cacheGet(cacheKey);
        if (cached) { res.setHeader('X-Cache', 'HIT'); return res.json(cached); }
        res.setHeader('X-Cache', 'MISS');

        const all     = ['pets', 'products', 'services', 'events', 'mates'];
        const results = await search(query, all, 3);

        const labelMap = { pets: 'Pet', products: 'Product', services: 'Service', events: 'Event', mates: 'Mate Listing' };
        const iconMap  = { pets: 'paw', products: 'shopping-cart', services: 'concierge-bell', events: 'calendar-alt', mates: 'heart' };

        const suggestions = all.flatMap(type =>
            (results[type] || []).map(item => ({
                ...item,
                name:          item.name || item.title || '',
                categoryLabel: labelMap[type],
                icon:          iconMap[type],
                type:          type.replace(/s$/, '')
            }))
        ).slice(0, 10);

        const body = { success: true, data: { query, suggestions, hasMore: suggestions.length === 10 } };
        await cacheSet(cacheKey, body, 30);
        return res.json(body);
    } catch (err) {
        res.status(500).json({ success: false, error: 'Suggestions failed', message: err.message });
    }
});

// Backward-compatibility alias
router.get('/quick', (req, res, next) => {
    req.url = req.url.replace('/quick', '/suggestions');
    next('router');
});

/**
 * @swagger
 * /api/search/{category}:
 *   get:
 *     tags: [Search]
 *     summary: Paginated search within a single category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pets, products, services, events, mates]
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated results for the category
 *       400:
 *         description: Invalid category
 */
router.get('/:category', async (req, res) => {
    const { category } = req.params;
    const { q, term, limit = 20, page = 1 } = req.query;
    const query = (q || term || '').trim();

    const validCategories = ['pets', 'products', 'services', 'events', 'mates'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, error: 'Invalid category', validCategories });
    }
    if (!query) {
        return res.json({ success: true, data: { query, category, results: [], pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 } } });
    }

    try {
        const fetchLimit = parseInt(limit) * parseInt(page);
        const results    = await search(query, [category], fetchLimit);
        const all        = results[category] || [];
        const skip       = (parseInt(page) - 1) * parseInt(limit);
        const paged      = all.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            data: {
                query, category, results: paged,
                engine: isTypesenseReady() ? 'typesense' : 'mongodb',
                pagination: { total: all.length, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(all.length / parseInt(limit)) }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Category search failed', message: err.message });
    }
});

module.exports = router;