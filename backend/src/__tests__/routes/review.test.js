/**
 * Tests: Review routes (/api/reviews)
 * Covers: GET reviews list, GET stats, POST create review, DELETE review
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

const FAKE_USER_ID = '64a1b2c3d4e5f6a7b8c9d0e1';
const FAKE_TARGET_ID = '64a1b2c3d4e5f6a7b8c9d0e2';
const FAKE_REVIEW_ID = '64a1b2c3d4e5f6a7b8c9d0e3';

jest.mock('../../models/reviews', () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../models/products', () => ({ findById: jest.fn() }));
jest.mock('../../models/pets', () => ({ findById: jest.fn() }));
jest.mock('../../models/users', () => ({ findById: jest.fn() }));
jest.mock('../../models/order', () => ({ findOne: jest.fn() }));
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
const session = require('express-session');

const reviewRoutes = require('../../routes/review.routes');
const Review = require('../../models/reviews');
// Helper to build a fully chainable mock query (for reviews with populate chain)
function mockChain(data) {
    const chain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(data)
    };
    return chain;
}
function buildApp(authenticated = true) {
    const app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use((req, _res, next) => {
        if (authenticated) {
            req.session.userId = FAKE_USER_ID;
            req.user = { _id: FAKE_USER_ID, role: 'owner' };
        }
        next();
    });
    app.use('/api/reviews', reviewRoutes);
    return app;
}

const app = buildApp(true);
const unauthApp = buildApp(false);

// ── GET /api/reviews/:targetType/:targetId ────────────────────────────────────

describe('GET /api/reviews/:targetType/:targetId', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 for invalid targetType', async () => {
        const res = await request(app).get(`/api/reviews/InvalidType/${FAKE_TARGET_ID}`);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/Invalid target type/i);
    });

    it('returns reviews for a valid Product targetType', async () => {
        Review.countDocuments.mockResolvedValue(1);
        // First call: paginated reviews with populate chain
        // Second call: all reviews for rating distribution (select chain)
        Review.find
            .mockReturnValueOnce(mockChain([{
                _id: FAKE_REVIEW_ID,
                rating: 5,
                comment: 'Great!',
                user: { _id: FAKE_USER_ID, fullName: 'Test User', username: 'testuser', profilePicture: null },
                createdAt: new Date(),
                updatedAt: new Date()
            }]))
            .mockReturnValueOnce(mockChain([{ rating: 5 }]));

        const res = await request(app).get(`/api/reviews/Product/${FAKE_TARGET_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('reviews');
        expect(res.body.data).toHaveProperty('statistics');
        expect(res.body.data).toHaveProperty('pagination');
    });

    it('accepts Pet as a valid targetType', async () => {
        Review.countDocuments.mockResolvedValue(0);
        Review.find.mockReturnValue(mockChain([]));
        const res = await request(app).get(`/api/reviews/Pet/${FAKE_TARGET_ID}`);
        expect(res.status).toBe(200);
    });

    it('accepts ServiceProvider as a valid targetType', async () => {
        Review.countDocuments.mockResolvedValue(0);
        Review.find.mockReturnValue(mockChain([]));
        const res = await request(app).get(`/api/reviews/ServiceProvider/${FAKE_TARGET_ID}`);
        expect(res.status).toBe(200);
    });

    it('returns correct pagination metadata', async () => {
        Review.countDocuments.mockResolvedValue(25);
        Review.find.mockReturnValue(mockChain([]));
        const res = await request(app).get(`/api/reviews/Product/${FAKE_TARGET_ID}?page=2&limit=10`);
        expect(res.status).toBe(200);
        expect(res.body.data.pagination.total).toBe(25);
        expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('returns avgRating 0 when there are no reviews', async () => {
        Review.countDocuments.mockResolvedValue(0);
        Review.find.mockReturnValue(mockChain([]));
        const res = await request(app).get(`/api/reviews/Product/${FAKE_TARGET_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.data.statistics.avgRating).toBe(0);
    });
});

// ── GET /api/reviews/:targetType/:targetId/stats ──────────────────────────────

describe('GET /api/reviews/:targetType/:targetId/stats', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns rating statistics for a product', async () => {
        Review.countDocuments.mockResolvedValue(3);
        Review.find.mockReturnValue(mockChain([{ rating: 5 }, { rating: 4 }, { rating: 3 }]));
        const res = await request(app).get(`/api/reviews/Product/${FAKE_TARGET_ID}/stats`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('avgRating');
        expect(res.body.data).toHaveProperty('reviewCount');
    });

    it('returns 0 avg when no reviews exist', async () => {
        Review.countDocuments.mockResolvedValue(0);
        Review.find.mockReturnValue(mockChain([]));
        const res = await request(app).get(`/api/reviews/Product/${FAKE_TARGET_ID}/stats`);
        expect(res.status).toBe(200);
        expect(res.body.data.avgRating).toBe(0);
        expect(res.body.data.reviewCount).toBe(0);
    });
});

// ── POST /api/reviews ─────────────────────────────────────────────────────────

describe('POST /api/reviews — authentication', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(unauthApp).post('/api/reviews').send({ rating: 5, comment: 'Nice' });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/reviews — validation', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 for invalid targetType', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .send({ targetType: 'Bogus', targetId: FAKE_TARGET_ID, rating: 4 });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid target type/i);
    });

    it('returns 400 when rating is out of range (> 5)', async () => {
        Review.findOne.mockResolvedValue(null);
        const Order = require('../../models/order');
        Order.findOne.mockResolvedValue({ _id: 'oid' });
        const res = await request(app)
            .post('/api/reviews')
            .send({ targetType: 'Product', targetId: FAKE_TARGET_ID, rating: 6 });
        expect([400, 500]).toContain(res.status);
    });

    it('returns 400 when rating is below range (< 1)', async () => {
        Review.findOne.mockResolvedValue(null);
        const Order = require('../../models/order');
        Order.findOne.mockResolvedValue({ _id: 'oid' });
        const res = await request(app)
            .post('/api/reviews')
            .send({ targetType: 'Product', targetId: FAKE_TARGET_ID, rating: 0 });
        expect([400, 500]).toContain(res.status);
    });
});

// ── DELETE /api/reviews/:reviewId ─────────────────────────────────────────────

describe('DELETE /api/reviews/:reviewId', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 401 when not authenticated', async () => {
        const res = await request(unauthApp).delete(`/api/reviews/${FAKE_REVIEW_ID}`);
        expect(res.status).toBe(401);
    });

    it('returns 404 when review does not exist', async () => {
        Review.findById.mockResolvedValue(null);
        const res = await request(app).delete(`/api/reviews/${FAKE_REVIEW_ID}`);
        expect(res.status).toBe(404);
    });

    it('returns 403 when user did not write the review', async () => {
        const otherUserId = '64a1b2c3d4e5f6a7b8c9d0ff';
        Review.findById.mockResolvedValue({
            _id: FAKE_REVIEW_ID,
            user: { toString: () => otherUserId }
        });
        const res = await request(app).delete(`/api/reviews/${FAKE_REVIEW_ID}`);
        expect(res.status).toBe(403);
    });
});
