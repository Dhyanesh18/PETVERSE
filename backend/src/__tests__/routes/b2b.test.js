/**
 * Integration tests: B2B API routes (/api/b2b/*)
 * Uses supertest against a minimal express app (no MongoDB / Redis connection).
 */

// ── env (before any require) ─────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';
process.env.B2B_API_KEYS = 'valid-test-key';

// ── mock mongoose models ─────────────────────────────────────────────────────
jest.mock('../../models/pets', () => ({
    countDocuments: jest.fn(),
    find: jest.fn()
}));
jest.mock('../../models/products', () => ({
    countDocuments: jest.fn(),
    find: jest.fn()
}));
jest.mock('../../models/users', () => ({
    countDocuments: jest.fn(),
    find: jest.fn()
}));

// ── mock ioredis ─────────────────────────────────────────────────────────────
jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([])
})));

const request = require('supertest');
const express = require('express');
const b2bRoutes = require('../../routes/b2b.routes');

const Pet     = require('../../models/pets');
const Product = require('../../models/products');
const User    = require('../../models/users');

// Build a minimal express app for testing
function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/b2b', b2bRoutes);
    return app;
}

const app = buildApp();
const VALID_KEY   = 'valid-test-key';
const INVALID_KEY = 'wrong-key';

// ── helper: mock mongoose chain ───────────────────────────────────────────────
function mockMongooseQuery(data) {
    const chain = {
        select: jest.fn().mockReturnThis(),
        sort:   jest.fn().mockReturnThis(),
        skip:   jest.fn().mockReturnThis(),
        limit:  jest.fn().mockReturnThis(),
        lean:   jest.fn().mockResolvedValue(data)
    };
    return chain;
}

// ═══════════════════════════════════════════════════════════════════════════
//  API-KEY AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

describe('B2B authentication', () => {
    it('returns 401 when X-API-Key header is missing', async () => {
        const res = await request(app).get('/api/b2b/stats');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/Missing API key/i);
    });

    it('returns 403 when X-API-Key is invalid', async () => {
        const res = await request(app)
            .get('/api/b2b/stats')
            .set('X-API-Key', INVALID_KEY);
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/Invalid API key/i);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/b2b/pets
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/b2b/pets', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns paginated pets list', async () => {
        const fakePets = [
            { _id: 'pet1', name: 'Buddy', category: 'Dog', breed: 'Labrador',
              age: '2', gender: 'male', price: 5000, description: 'Friendly', available: true,
              images: [{ url: 'https://cloudinary.com/pet1.jpg' }], createdAt: new Date() }
        ];

        Pet.countDocuments.mockResolvedValue(1);
        Pet.find.mockReturnValue(mockMongooseQuery(fakePets));

        const res = await request(app)
            .get('/api/b2b/pets')
            .set('X-API-Key', VALID_KEY);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pets).toHaveLength(1);
        expect(res.body.data.pets[0].name).toBe('Buddy');
        expect(res.body.data.pagination.total).toBe(1);
    });

    it('filters by category when provided', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockMongooseQuery([]));

        await request(app)
            .get('/api/b2b/pets?category=Cat')
            .set('X-API-Key', VALID_KEY);

        expect(Pet.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'Cat' })
        );
    });

    it('returns 200 with empty list when no pets found', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockMongooseQuery([]));

        const res = await request(app)
            .get('/api/b2b/pets')
            .set('X-API-Key', VALID_KEY);

        expect(res.status).toBe(200);
        expect(res.body.data.pets).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/b2b/products
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/b2b/products', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns paginated products list', async () => {
        const fakeProducts = [
            { _id: 'prod1', name: 'Dog Food', category: 'Pet Food', brand: 'Royal Canin',
              price: 1200, discount: 10, stock: 50, description: 'Premium food',
              avgRating: 4.5, images: [{ url: 'https://cloudinary.com/prod1.jpg' }], createdAt: new Date() }
        ];

        Product.countDocuments.mockResolvedValue(1);
        Product.find.mockReturnValue(mockMongooseQuery(fakeProducts));

        const res = await request(app)
            .get('/api/b2b/products')
            .set('X-API-Key', VALID_KEY);

        expect(res.status).toBe(200);
        expect(res.body.data.products[0].name).toBe('Dog Food');
        expect(res.body.data.pagination.total).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/b2b/services
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/b2b/services', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns approved service providers', async () => {
        const fakeProviders = [
            { _id: 'sp1', fullName: 'Dr. Sharma', username: 'drsharma',
              serviceType: 'veterinarian', serviceAddress: 'Delhi', phoneNo: '9876543210',
              createdAt: new Date() }
        ];

        const chain = {
            select: jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue(fakeProviders)
        };
        User.find.mockReturnValue(chain);

        const res = await request(app)
            .get('/api/b2b/services')
            .set('X-API-Key', VALID_KEY);

        expect(res.status).toBe(200);
        expect(res.body.data.services[0].serviceType).toBe('veterinarian');
        expect(res.body.data.total).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/b2b/stats
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/b2b/stats', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns platform statistics', async () => {
        Pet.countDocuments.mockResolvedValue(12);
        Product.countDocuments.mockResolvedValue(34);
        User.countDocuments
            .mockResolvedValueOnce(7)   // service providers
            .mockResolvedValueOnce(42); // owners

        const res = await request(app)
            .get('/api/b2b/stats')
            .set('X-API-Key', VALID_KEY);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.availablePets).toBe(12);
        expect(res.body.data.activeProducts).toBe(34);
        expect(res.body.data.serviceProviders).toBe(7);
        expect(res.body.data.registeredPetOwners).toBe(42);
        expect(res.body.data.generatedAt).toBeDefined();
    });
});
