/**
 * Integration tests: Search routes (/api/search)
 * Covers Typesense primary path, MongoDB fallback, suggestions, and category search.
 */

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';

// ── Mock Typesense utility ─────────────────────────────────────────────────
jest.mock('../../utils/typesense', () => ({
    isTypesenseReady: jest.fn(),
    multiSearch:      jest.fn()
}));

// ── Mock Redis (no caching — clean per-test results) ──────────────────────
jest.mock('../../utils/redis', () => ({
    cacheGet: jest.fn().mockResolvedValue(null),
    cacheSet: jest.fn().mockResolvedValue(undefined)
}));

// ── Mock all models used by mongoFallback ──────────────────────────────────
jest.mock('../../models/pets',    () => ({ find: jest.fn() }));
jest.mock('../../models/products',() => ({ find: jest.fn() }));
jest.mock('../../models/users',   () => ({ find: jest.fn() }));
jest.mock('../../models/event',   () => ({ find: jest.fn() }));
jest.mock('../../models/petMate', () => ({ find: jest.fn() }));

const request = require('supertest');
const express = require('express');

const searchRoutes              = require('../../routes/search.routes');
const { isTypesenseReady, multiSearch } = require('../../utils/typesense');
const { cacheGet, cacheSet }    = require('../../utils/redis');

const Pet     = require('../../models/pets');
const Product = require('../../models/products');
const User    = require('../../models/users');
const Event   = require('../../models/event');
const PetMate = require('../../models/petMate');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/search', searchRoutes);
    return app;
}

const app = buildApp();

// Universal mongoose-chain mock (handles sort/limit/select/lean)
function mockChain(data) {
    return {
        sort:   jest.fn().mockReturnThis(),
        limit:  jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean:   jest.fn().mockResolvedValue(data)
    };
}

function setupMongoMocks(petDocs = [], productDocs = [], userDocs = [], eventDocs = [], mateDocs = []) {
    Pet.find.mockReturnValue(mockChain(petDocs));
    Product.find.mockReturnValue(mockChain(productDocs));
    User.find.mockReturnValue(mockChain(userDocs));
    Event.find.mockReturnValue(mockChain(eventDocs));
    PetMate.find.mockReturnValue(mockChain(mateDocs));
}

const TYPESENSE_RESULTS = {
    pets:     [{ id: 'p1', name: 'Buddy', breed: 'Lab', type: 'pet', score: 100 }],
    products: [{ id: 'pr1', name: 'Dog Food', category: 'Pet Food', type: 'product', score: 90 }],
    services: [],
    events:   [],
    mates:    []
};

// ═══════════════════════════════════════════════════════════════════════════
//  Empty query
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/search — empty query', () => {
    it('returns 200 with empty collection arrays without touching any DB', async () => {
        const res = await request(app).get('/api/search?q=');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalResults).toBe(0);
        expect(multiSearch).not.toHaveBeenCalled();
        expect(Pet.find).not.toHaveBeenCalled();
    });

    it('also returns empty results when q param is omitted', async () => {
        const res = await request(app).get('/api/search');

        expect(res.status).toBe(200);
        expect(res.body.data.totalResults).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Typesense primary path
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/search — Typesense primary path', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheGet.mockResolvedValue(null);
        isTypesenseReady.mockReturnValue(true);
        multiSearch.mockResolvedValue({ ...TYPESENSE_RESULTS });
    });

    it('returns results from Typesense when available', async () => {
        const res = await request(app).get('/api/search?q=buddy');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(multiSearch).toHaveBeenCalled();
        expect(Pet.find).not.toHaveBeenCalled(); // MongoDB not hit
        expect(res.body.data.pets).toHaveLength(1);
        expect(res.body.data.pets[0].name).toBe('Buddy');
    });

    it('sets X-Search-Engine: typesense response header', async () => {
        const res = await request(app).get('/api/search?q=buddy');

        expect(res.headers['x-search-engine']).toBe('typesense');
    });

    it('includes engine field in response body', async () => {
        const res = await request(app).get('/api/search?q=buddy');

        expect(res.body.data.engine).toBe('typesense');
    });

    it('calculates totalResults as sum across all categories', async () => {
        const res = await request(app).get('/api/search?q=buddy');

        // TYPESENSE_RESULTS has 1 pet + 1 product = 2
        expect(res.body.data.totalResults).toBe(2);
    });

    it('includes resultCounts per category', async () => {
        const res = await request(app).get('/api/search?q=buddy');

        expect(res.body.data.resultCounts).toEqual(
            expect.objectContaining({ pets: 1, products: 1, services: 0, events: 0, mates: 0 })
        );
    });

    it('caches results for subsequent calls', async () => {
        await request(app).get('/api/search?q=buddy');

        expect(cacheSet).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ success: true }),
            60
        );
    });

    it('falls back to MongoDB when Typesense throws', async () => {
        multiSearch.mockRejectedValue(new Error('Typesense timeout'));
        setupMongoMocks(
            [{ _id: 'p1', name: 'Max', breed: 'Labrador', category: 'Dog', price: 3000, gender: 'male', images: [] }]
        );

        const res = await request(app).get('/api/search?q=labrador');

        expect(res.status).toBe(200);
        expect(Pet.find).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  MongoDB fallback path
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/search — MongoDB fallback path', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheGet.mockResolvedValue(null);
        isTypesenseReady.mockReturnValue(false);
        setupMongoMocks(
            [{ _id: 'p1', name: 'Max', breed: 'Labrador', category: 'Dog', price: 5000, gender: 'male', images: [] }]
        );
    });

    it('does NOT call Typesense when isTypesenseReady is false', async () => {
        await request(app).get('/api/search?q=labrador');

        expect(multiSearch).not.toHaveBeenCalled();
        expect(Pet.find).toHaveBeenCalled();
    });

    it('sets X-Search-Engine: mongodb response header', async () => {
        const res = await request(app).get('/api/search?q=labrador');

        expect(res.headers['x-search-engine']).toBe('mongodb');
    });

    it('returns engine: mongodb in response body', async () => {
        const res = await request(app).get('/api/search?q=labrador');

        expect(res.body.data.engine).toBe('mongodb');
    });

    it('returns 200 with mapped pet results', async () => {
        const res = await request(app).get('/api/search?q=labrador');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.pets)).toBe(true);
    });

    it('sets X-Cache: MISS when cache is cold', async () => {
        const res = await request(app).get('/api/search?q=labrador');

        expect(res.headers['x-cache']).toBe('MISS');
    });

    it('returns cached response with X-Cache: HIT on second call', async () => {
        const cachedBody = { success: true, data: { query: 'lab', engine: 'mongodb', pets: [], products: [], services: [], events: [], mates: [], totalResults: 0 } };
        cacheGet.mockResolvedValueOnce(cachedBody);

        const res = await request(app).get('/api/search?q=lab');

        expect(res.headers['x-cache']).toBe('HIT');
        expect(Pet.find).not.toHaveBeenCalled(); // not re-queried
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/search/suggestions
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/search/suggestions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheGet.mockResolvedValue(null);
        isTypesenseReady.mockReturnValue(true);
        multiSearch.mockResolvedValue({
            pets:     [{ id: 'p1', name: 'Buddy', type: 'pet' }],
            products: [{ id: 'pr1', name: 'Dog Food', type: 'product' }],
            services: [],
            events:   [],
            mates:    []
        });
    });

    it('returns empty suggestions for query shorter than 2 characters', async () => {
        const res = await request(app).get('/api/search/suggestions?q=a');

        expect(res.status).toBe(200);
        expect(res.body.data.suggestions).toHaveLength(0);
        expect(multiSearch).not.toHaveBeenCalled();
    });

    it('returns suggestions for query of 2+ characters', async () => {
        const res = await request(app).get('/api/search/suggestions?q=do');

        expect(res.status).toBe(200);
        expect(res.body.data.suggestions.length).toBeGreaterThan(0);
    });

    it('mixes results from multiple categories', async () => {
        const res = await request(app).get('/api/search/suggestions?q=dog');

        const types = res.body.data.suggestions.map(s => s.type);
        expect(types).toContain('pet');
        expect(types).toContain('product');
    });

    it('caches suggestions with 30 second TTL', async () => {
        await request(app).get('/api/search/suggestions?q=dog');

        expect(cacheSet).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            30
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/search/:category
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/search/:category', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheGet.mockResolvedValue(null);
        isTypesenseReady.mockReturnValue(false);
        setupMongoMocks(
            [{ _id: 'p1', name: 'Max', breed: 'Labrador', category: 'Dog', price: 3000, gender: 'male', images: [] }]
        );
    });

    it('returns 400 for an unrecognised category', async () => {
        const res = await request(app).get('/api/search/dinosaurs?q=rex');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.validCategories).toBeDefined();
    });

    it('returns 200 and results for category=pets', async () => {
        const res = await request(app).get('/api/search/pets?q=labrador');

        expect(res.status).toBe(200);
        expect(res.body.data.category).toBe('pets');
        expect(Array.isArray(res.body.data.results)).toBe(true);
    });

    it('returns empty results for empty query', async () => {
        const res = await request(app).get('/api/search/pets?q=');

        expect(res.status).toBe(200);
        expect(res.body.data.results).toHaveLength(0);
    });

    it('includes pagination metadata in response', async () => {
        const res = await request(app).get('/api/search/pets?q=lab&page=1&limit=5');

        expect(res.body.data.pagination).toBeDefined();
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(5);
    });

    it('works for category=products', async () => {
        setupMongoMocks([], [{ _id: 'pr1', name: 'Dog Shampoo', brand: 'PetClean', category: 'Grooming', price: 250, images: [] }]);

        const res = await request(app).get('/api/search/products?q=shampoo');

        expect(res.status).toBe(200);
        expect(res.body.data.category).toBe('products');
    });
});
