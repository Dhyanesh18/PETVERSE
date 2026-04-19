/**
 * Tests: Wishlist routes (/api/wishlist)
 * Covers: get wishlist, toggle pet, toggle product, check status
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

const mongoose = require('mongoose');

const FAKE_USER_ID = new mongoose.Types.ObjectId().toString();
const FAKE_PET_ID  = new mongoose.Types.ObjectId().toString();
const FAKE_PROD_ID = new mongoose.Types.ObjectId().toString();

jest.mock('../../models/users', () => ({
    findById: jest.fn()
}));
jest.mock('../../models/pets', () => ({
    findById: jest.fn(),
    find: jest.fn()
}));
jest.mock('../../models/products', () => ({
    findById: jest.fn(),
    find: jest.fn()
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

const wishlistRoutes = require('../../routes/wishlist.routes');
const User    = require('../../models/users');
const Pet     = require('../../models/pets');
const Product = require('../../models/products');

function mockSelectChain(data) {
    return { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(data) };
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
    app.use('/api/wishlist', wishlistRoutes);
    return app;
}

const app       = buildApp(true);
const unauthApp = buildApp(false);

// ── GET /api/wishlist ─────────────────────────────────────────────────────────

describe('GET /api/wishlist — authentication', () => {
    it('returns 401 when not logged in', async () => {
        const res = await request(unauthApp).get('/api/wishlist');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/wishlist — authenticated', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns empty wishlist when user has none saved', async () => {
        User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: FAKE_USER_ID, wishlistPets: [], wishlistProducts: [] }) });
        Pet.find.mockReturnValue(mockSelectChain([]));
        Product.find.mockReturnValue(mockSelectChain([]));
        const res = await request(app).get('/api/wishlist');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pets).toEqual([]);
        expect(res.body.data.products).toEqual([]);
    });

    it('returns populated wishlist items', async () => {
        User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: FAKE_USER_ID, wishlistPets: [FAKE_PET_ID], wishlistProducts: [FAKE_PROD_ID] }) });
        Pet.find.mockReturnValue(mockSelectChain([{ _id: FAKE_PET_ID, name: 'Buddy', breed: 'Lab', images: [] }]));
        Product.find.mockReturnValue(mockSelectChain([{ _id: FAKE_PROD_ID, name: 'Dog Toy', price: 150, images: [] }]));
        const res = await request(app).get('/api/wishlist');
        expect(res.status).toBe(200);
        expect(res.body.data.pets).toHaveLength(1);
        expect(res.body.data.products).toHaveLength(1);
        expect(res.body.data.totalCount).toBe(2);
    });

    it('returns 404 when user not found', async () => {
        User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        const res = await request(app).get('/api/wishlist');
        expect(res.status).toBe(404);
    });
});

// ── POST /api/wishlist/pet/:petId/toggle ──────────────────────────────────────

describe('POST /api/wishlist/pet/:petId/toggle — authentication', () => {
    it('returns 401 when not logged in', async () => {
        const res = await request(unauthApp).post(`/api/wishlist/pet/${FAKE_PET_ID}/toggle`);
        expect(res.status).toBe(401);
    });
});

describe('POST /api/wishlist/pet/:petId/toggle', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 404 when pet does not exist', async () => {
        Pet.findById.mockResolvedValue(null);
        const res = await request(app).post(`/api/wishlist/pet/${FAKE_PET_ID}/toggle`);
        expect(res.status).toBe(404);
    });

    it('adds pet to wishlist and returns isWishlisted:true', async () => {
        Pet.findById.mockResolvedValue({ _id: FAKE_PET_ID, name: 'Buddy' });
        const petIdObj = new mongoose.Types.ObjectId(FAKE_PET_ID);
        const fakeUser = {
            _id: FAKE_USER_ID,
            wishlistPets: [],
            save: jest.fn().mockResolvedValue(true)
        };
        fakeUser.wishlistPets.some = () => false;
        fakeUser.wishlistPets.filter = () => fakeUser.wishlistPets;
        fakeUser.wishlistPets.push = jest.fn();
        User.findById.mockResolvedValue(fakeUser);
        const res = await request(app).post(`/api/wishlist/pet/${FAKE_PET_ID}/toggle`);
        expect(res.status).toBe(200);
        expect(res.body.data.isWishlisted).toBe(true);
    });

    it('removes pet from wishlist and returns isWishlisted:false', async () => {
        Pet.findById.mockResolvedValue({ _id: FAKE_PET_ID, name: 'Buddy' });
        const existingId = new mongoose.Types.ObjectId(FAKE_PET_ID);
        const fakeUser = {
            _id: FAKE_USER_ID,
            wishlistPets: [existingId],
            save: jest.fn().mockResolvedValue(true)
        };
        fakeUser.wishlistPets.some = () => true;
        fakeUser.wishlistPets.filter = jest.fn().mockReturnValue([]);
        User.findById.mockResolvedValue(fakeUser);
        const res = await request(app).post(`/api/wishlist/pet/${FAKE_PET_ID}/toggle`);
        expect(res.status).toBe(200);
        expect(res.body.data.isWishlisted).toBe(false);
    });

    it('returns 500 for invalid pet ObjectId format (no explicit validation)', async () => {
        const res = await request(app).post('/api/wishlist/pet/not-valid-id/toggle');
        expect([400, 500]).toContain(res.status);
    });
});

// ── POST /api/wishlist/product/:productId/toggle ──────────────────────────────

describe('POST /api/wishlist/product/:productId/toggle — authentication', () => {
    it('returns 401 when not logged in', async () => {
        const res = await request(unauthApp).post(`/api/wishlist/product/${FAKE_PROD_ID}/toggle`);
        expect(res.status).toBe(401);
    });
});

describe('POST /api/wishlist/product/:productId/toggle', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 404 when product does not exist', async () => {
        Product.findById.mockResolvedValue(null);
        const res = await request(app).post(`/api/wishlist/product/${FAKE_PROD_ID}/toggle`);
        expect(res.status).toBe(404);
    });

    it('adds product to wishlist and returns isWishlisted:true', async () => {
        Product.findById.mockResolvedValue({ _id: FAKE_PROD_ID, name: 'Dog Toy' });
        const fakeUser = {
            _id: FAKE_USER_ID,
            wishlistProducts: [],
            save: jest.fn().mockResolvedValue(true)
        };
        fakeUser.wishlistProducts.some = () => false;
        fakeUser.wishlistProducts.filter = () => fakeUser.wishlistProducts;
        fakeUser.wishlistProducts.push = jest.fn();
        User.findById.mockResolvedValue(fakeUser);
        const res = await request(app).post(`/api/wishlist/product/${FAKE_PROD_ID}/toggle`);
        expect(res.status).toBe(200);
        expect(res.body.data.isWishlisted).toBe(true);
    });

    it('removes product from wishlist and returns isWishlisted:false', async () => {
        Product.findById.mockResolvedValue({ _id: FAKE_PROD_ID, name: 'Dog Toy' });
        const existingId = new mongoose.Types.ObjectId(FAKE_PROD_ID);
        const fakeUser = {
            _id: FAKE_USER_ID,
            wishlistProducts: [existingId],
            save: jest.fn().mockResolvedValue(true)
        };
        fakeUser.wishlistProducts.some = () => true;
        fakeUser.wishlistProducts.filter = jest.fn().mockReturnValue([]);
        User.findById.mockResolvedValue(fakeUser);
        const res = await request(app).post(`/api/wishlist/product/${FAKE_PROD_ID}/toggle`);
        expect(res.status).toBe(200);
        expect(res.body.data.isWishlisted).toBe(false);
    });

    it('returns 500 for invalid product ObjectId format (no explicit validation)', async () => {
        const res = await request(app).post('/api/wishlist/product/not-valid/toggle');
        expect([400, 500]).toContain(res.status);
    });
});

// ── GET /api/wishlist/status/:type/:id ────────────────────────────────────────

describe('GET /api/wishlist/status/:type/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 200 with inWishlist:false when not authenticated (no 401)', async () => {
        // Controller returns 200 false (not 401) when no userId in session
        const res = await request(unauthApp).get(`/api/wishlist/status/pet/${FAKE_PET_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.inWishlist).toBe(false);
    });

    it('returns inWishlist from pet document when pet found', async () => {
        Pet.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ wishlist: false }) });
        const res = await request(app).get(`/api/wishlist/status/pet/${FAKE_PET_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.inWishlist).toBe(false);
    });

    it('returns inWishlist:true when pet wishlist field is true', async () => {
        Pet.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ wishlist: true }) });
        const res = await request(app).get(`/api/wishlist/status/pet/${FAKE_PET_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.inWishlist).toBe(true);
    });

    it('returns inWishlist from product document when product found', async () => {
        Product.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ wishlist: false }) });
        const res = await request(app).get(`/api/wishlist/status/product/${FAKE_PROD_ID}`);
        expect(res.status).toBe(200);
        expect(res.body.inWishlist).toBe(false);
    });

    it('returns 400 for unknown item type', async () => {
        const res = await request(app).get(`/api/wishlist/status/unknown/${FAKE_PET_ID}`);
        expect(res.status).toBe(400);
    });

    it('returns 404 when item not found', async () => {
        Pet.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        const res = await request(app).get(`/api/wishlist/status/pet/${FAKE_PET_ID}`);
        expect(res.status).toBe(404);
    });
});
