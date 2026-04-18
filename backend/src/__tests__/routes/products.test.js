/**
 * Integration tests: Product routes (/api/products)
 * Public GET list endpoint — filters, pagination, sorting, cache header.
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

jest.mock('../../models/products', () => ({
    countDocuments: jest.fn(),
    find: jest.fn(),
    distinct: jest.fn()
}));

jest.mock('../../utils/cloudinary', () => ({
    uploadMultipleToCloudinary: jest.fn(),
    deleteMultipleFromCloudinary: jest.fn()
}));

// Mock Typesense so product route loads without a real Typesense server
jest.mock('../../utils/typesense', () => ({
    syncProduct:   jest.fn().mockResolvedValue(undefined),
    deleteProduct: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({
    on:      jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    get:     jest.fn().mockResolvedValue(null),  // always cache MISS
    set:     jest.fn().mockResolvedValue('OK'),
    del:     jest.fn().mockResolvedValue(1),
    keys:    jest.fn().mockResolvedValue([])
})));

const request  = require('supertest');
const express  = require('express');
const session  = require('express-session');

const productRoutes = require('../../routes/product.routes');
const Product       = require('../../models/products');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use('/api/products', productRoutes);
    return app;
}

const app = buildApp();

// Build a mongoose query-chain mock
function mockProductQuery(data) {
    return {
        populate: jest.fn().mockReturnThis(),
        sort:     jest.fn().mockReturnThis(),
        skip:     jest.fn().mockReturnThis(),
        limit:    jest.fn().mockReturnThis(),
        lean:     jest.fn().mockResolvedValue(data)
    };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/products
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/products', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 200 with paginated product list', async () => {
        const fakeProducts = [{
            _id: 'prod1', name: 'Royal Canin Dog Food', category: 'Pet Food',
            brand: 'Royal Canin', price: 1200, discount: 10,
            stock: 50, isActive: true,
            seller: { fullName: 'PetStore', businessName: 'PetStore Ltd' },
            images: [{ url: 'https://cdn.example.com/prod1.jpg' }],
            createdAt: new Date()
        }];

        Product.countDocuments.mockResolvedValue(1);
        Product.find.mockReturnValue(mockProductQuery(fakeProducts));

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.products).toHaveLength(1);
        expect(res.body.data.products[0].name).toBe('Royal Canin Dog Food');
        expect(res.body.data.pagination.total).toBe(1);
        expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('defaults to isActive:true filter', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        await request(app).get('/api/products');

        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({ isActive: true })
        );
    });

    it('maps category alias petfood → Pet Food', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        await request(app).get('/api/products?category=petfood');

        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'Pet Food' })
        );
    });

    it('maps category alias toys → Toys', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        await request(app).get('/api/products?category=toys');

        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'Toys' })
        );
    });

    it('applies minPrice and maxPrice filter', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        await request(app).get('/api/products?minPrice=500&maxPrice=2000');

        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({ price: { $gte: 500, $lte: 2000 } })
        );
    });

    it('respects page and limit pagination parameters', async () => {
        Product.countDocuments.mockResolvedValue(36);
        const chain = mockProductQuery([]);
        Product.find.mockReturnValue(chain);

        const res = await request(app).get('/api/products?page=2&limit=12');

        expect(chain.skip).toHaveBeenCalledWith(12);  // (2-1)*12
        expect(chain.limit).toHaveBeenCalledWith(12);
        expect(res.body.data.pagination.totalPages).toBe(3);
        expect(res.body.data.pagination.page).toBe(2);
    });

    it('returns empty array when no products match', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        const res = await request(app).get('/api/products?category=nonexistent');

        expect(res.status).toBe(200);
        expect(res.body.data.products).toEqual([]);
        expect(res.body.data.pagination.total).toBe(0);
    });

    it('sorts by price ascending when sortBy=price-asc', async () => {
        Product.countDocuments.mockResolvedValue(0);
        const chain = mockProductQuery([]);
        Product.find.mockReturnValue(chain);

        await request(app).get('/api/products?sortBy=price-asc');

        expect(chain.sort).toHaveBeenCalledWith({ price: 1 });
    });

    it('sorts by price descending when sortBy=price-desc', async () => {
        Product.countDocuments.mockResolvedValue(0);
        const chain = mockProductQuery([]);
        Product.find.mockReturnValue(chain);

        await request(app).get('/api/products?sortBy=price-desc');

        expect(chain.sort).toHaveBeenCalledWith({ price: -1 });
    });

    it('computes discountedPrice correctly (price * (1 - discount/100))', async () => {
        const fakeProducts = [{
            _id: 'prod2', name: 'Dog Toy', category: 'Toys',
            brand: 'PetPlay', price: 500, discount: 20,
            stock: 10, isActive: true, seller: null, images: [], createdAt: new Date()
        }];

        Product.countDocuments.mockResolvedValue(1);
        Product.find.mockReturnValue(mockProductQuery(fakeProducts));

        const res = await request(app).get('/api/products');

        const p = res.body.data.products[0];
        expect(parseFloat(p.discountedPrice)).toBe(400); // 500 * 0.8
    });

    it('returns X-Cache: MISS header when cache is cold', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        const res = await request(app).get('/api/products');

        expect(res.headers['x-cache']).toBe('MISS');
    });

    it('includes filter metadata in response', async () => {
        Product.countDocuments.mockResolvedValue(0);
        Product.find.mockReturnValue(mockProductQuery([]));

        const res = await request(app).get('/api/products?category=toys&minPrice=100&maxPrice=500');

        expect(res.body.data.filters.category).toBe('toys');
        expect(res.body.data.filters.minPrice).toBe('100');
        expect(res.body.data.filters.maxPrice).toBe('500');
    });
});
