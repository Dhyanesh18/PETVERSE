/**
 * Tests: Services routes (/api/services)
 * Covers: listing, filtering, price calculation helper, category mapping helper
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

const FAKE_PROVIDER_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

jest.mock('../../models/users', () => ({
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn()
}));
jest.mock('../../models/reviews', () => ({
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    aggregate: jest.fn()
}));
jest.mock('../../models/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../models/transaction', () => ({}));
jest.mock('../../models/Booking', () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn()
}));
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

const serviceRoutes = require('../../routes/service.routes');
const User = require('../../models/users');
const Review = require('../../models/reviews');

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    Review.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    User.distinct.mockResolvedValue([]);
});

function buildApp(authenticated = false) {
    const app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    if (authenticated) {
        app.use((req, _res, next) => {
            req.session.userId = FAKE_PROVIDER_ID;
            req.user = { _id: FAKE_PROVIDER_ID, role: 'owner' };
            next();
        });
    }
    app.use('/api/services', serviceRoutes);
    return app;
}

const app = buildApp(false);

function mockProviders(data) {
    return {
        lean: jest.fn().mockResolvedValue(data)
    };
}

// ── GET /api/services ─────────────────────────────────────────────────────────

describe('GET /api/services — listing', () => {

    it('returns 200 with list of approved service providers', async () => {
        User.countDocuments.mockResolvedValue(2);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Dr. Smith', serviceType: 'veterinarian', isApproved: true },
            { _id: '64a1b2c3d4e5f6a7b8c9d0e2', fullName: 'Groomer Joe', serviceType: 'groomer', isApproved: true }
        ]));
        const res = await request(app).get('/api/services');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.services).toHaveLength(2);
    });

    it('returns empty list when no providers found', async () => {
        User.countDocuments.mockResolvedValue(0);
        User.find.mockReturnValue(mockProviders([]));
        const res = await request(app).get('/api/services');
        expect(res.status).toBe(200);
        expect(res.body.data.services).toHaveLength(0);
    });

    it('includes pagination metadata', async () => {
        const providers = Array.from({ length: 15 }, (_, i) => ({
            _id: `64a1b2c3d4e5f6a7b8c9d0${String(i).padStart(2, '0')}`,
            fullName: `Provider ${i}`,
            serviceType: 'groomer',
            isApproved: true
        }));
        User.find.mockReturnValue(mockProviders(providers));
        const res = await request(app).get('/api/services?page=1&limit=10');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('pagination');
        expect(res.body.data.pagination.total).toBe(15);
    });

    it('filters by serviceType when categories param provided', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Dr. Smith', serviceType: 'veterinarian', isApproved: true }
        ]));
        const res = await request(app).get('/api/services?categories=veterinarian');
        expect(res.status).toBe(200);
        // Verify find was called with a serviceType filter
        const findArg = User.find.mock.calls[0][0];
        expect(JSON.stringify(findArg)).toContain('veterinarian');
    });

    it('applies minPrice filter when provided', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Trainer Bob', serviceType: 'trainer', isApproved: true }
        ]));
        const res = await request(app).get('/api/services?minPrice=300');
        expect(res.status).toBe(200);
    });

    it('applies maxPrice filter when provided', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([]));
        const res = await request(app).get('/api/services?maxPrice=200');
        expect(res.status).toBe(200);
    });

    it('applies location (city) filter when provided', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Local Vet', serviceType: 'veterinarian', serviceAddress: 'Mumbai', isApproved: true }
        ]));
        const res = await request(app).get('/api/services?location=Mumbai');
        expect(res.status).toBe(200);
    });
});

// ── GET /api/services/filter-options ─────────────────────────────────────────

describe('GET /api/services/filter-options', () => {

    it('returns 200 with filter option arrays', async () => {
        User.distinct
            .mockResolvedValueOnce(['veterinarian', 'groomer'])
            .mockResolvedValueOnce(['Mumbai', 'Delhi']);
        const res = await request(app).get('/api/services/filter-options');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ── Price calculation helper (unit tests) ────────────────────────────────────

describe('Service price calculation logic', () => {
    // Test the price rules documented in the route (via the API response)

    it('veterinarian provider gets price 500', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Dr. Vet', serviceType: 'veterinarian', isApproved: true }
        ]));
        const res = await request(app).get('/api/services');
        expect(res.status).toBe(200);
        const provider = res.body.data.services[0];
        expect(provider.price).toBe(500);
    });

    it('groomer provider gets price 300', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Groomer', serviceType: 'groomer', isApproved: true }
        ]));
        const res = await request(app).get('/api/services');
        expect(res.status).toBe(200);
        const provider = res.body.data.services[0];
        expect(provider.price).toBe(300);
    });

    it('walking provider gets price 200', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Walker', serviceType: 'walking', isApproved: true }
        ]));
        const res = await request(app).get('/api/services');
        expect(res.status).toBe(200);
        const provider = res.body.data.services[0];
        expect(provider.price).toBe(200);
    });

    it('unknown service type gets default price 400', async () => {
        User.countDocuments.mockResolvedValue(1);
        User.find.mockReturnValue(mockProviders([
            { _id: FAKE_PROVIDER_ID, fullName: 'Other', serviceType: 'unknown_type', isApproved: true }
        ]));
        const res = await request(app).get('/api/services');
        expect(res.status).toBe(200);
        const provider = res.body.data.services[0];
        expect(provider.price).toBe(400);
    });
});
