/**
 * Integration tests: Pet routes (/api/pets)
 * Public GET list endpoint only (no auth needed).
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

jest.mock('../../models/pets', () => ({
    countDocuments: jest.fn(),
    find: jest.fn(),
    distinct: jest.fn()
}));

jest.mock('../../utils/cloudinary', () => ({
    uploadMultipleToCloudinary: jest.fn(),
    deleteMultipleFromCloudinary: jest.fn()
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
const petRoutes = require('../../routes/pet.routes');
const Pet = require('../../models/pets');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use('/api/pets', petRoutes);
    return app;
}

const app = buildApp();

// Helper: build a mongoose query chain mock
function mockPetQuery(data) {
    return {
        populate: jest.fn().mockReturnThis(),
        sort:     jest.fn().mockReturnThis(),
        skip:     jest.fn().mockReturnThis(),
        limit:    jest.fn().mockReturnThis(),
        lean:     jest.fn().mockResolvedValue(data)
    };
}

describe('GET /api/pets', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 200 with paginated pet list', async () => {
        const fakePets = [
            {
                _id: 'pet1', name: 'Max', category: 'Dog', breed: 'Golden Retriever',
                age: '1', gender: 'male', price: 8000, description: 'Playful',
                available: true, addedBy: { fullName: 'John' },
                images: [{ url: 'https://cdn.example.com/pet1.jpg' }], createdAt: new Date()
            }
        ];

        Pet.countDocuments.mockResolvedValue(1);
        Pet.find.mockReturnValue(mockPetQuery(fakePets));

        const res = await request(app).get('/api/pets');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pets).toHaveLength(1);
        expect(res.body.data.pets[0].name).toBe('Max');
        expect(res.body.data.pagination.total).toBe(1);
        expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('returns empty array when no pets match filter', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockPetQuery([]));

        const res = await request(app).get('/api/pets?category=birds');

        expect(res.status).toBe(200);
        expect(res.body.data.pets).toEqual([]);
        expect(res.body.data.pagination.total).toBe(0);
    });

    it('applies category filter correctly', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockPetQuery([]));

        await request(app).get('/api/pets?category=dogs');

        // 'dogs' maps to 'Dog'
        expect(Pet.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'Dog' })
        );
    });

    it('applies price range filter', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockPetQuery([]));

        await request(app).get('/api/pets?minPrice=1000&maxPrice=5000');

        expect(Pet.find).toHaveBeenCalledWith(
            expect.objectContaining({ price: { $gte: 1000, $lte: 5000 } })
        );
    });

    it('respects pagination parameters', async () => {
        Pet.countDocuments.mockResolvedValue(30);
        const chain = mockPetQuery([]);
        Pet.find.mockReturnValue(chain);

        const res = await request(app).get('/api/pets?page=2&limit=10');

        expect(chain.skip).toHaveBeenCalledWith(10); // (page-1)*limit = 1*10 = 10
        expect(chain.limit).toHaveBeenCalledWith(10);
        expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('defaults to available=true', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockPetQuery([]));

        await request(app).get('/api/pets');

        expect(Pet.find).toHaveBeenCalledWith(
            expect.objectContaining({ available: true })
        );
    });

    it('returns 200 with cache MISS header on first request', async () => {
        Pet.countDocuments.mockResolvedValue(0);
        Pet.find.mockReturnValue(mockPetQuery([]));

        const res = await request(app).get('/api/pets');

        expect(res.status).toBe(200);
        // Redis mock returns null (no cache), so X-Cache should be MISS
        expect(res.headers['x-cache']).toBe('MISS');
    });
});
