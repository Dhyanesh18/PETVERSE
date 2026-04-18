/**
 * Unit tests: Typesense utility (utils/typesense.js)
 * Mocks the 'typesense' npm package so tests run without a real Typesense server.
 * Uses jest.resetModules() before each test to reset module-level state
 * (client, isConnected) to a clean slate.
 */

process.env.NODE_ENV = 'test';
process.env.TYPESENSE_API_KEY = 'test-key';

// ── Build mock client once; share it via closure in the jest.mock factory ──
const mockUpsert   = jest.fn();
const mockDelete   = jest.fn();
const mockDocuments = jest.fn();
const mockCreate   = jest.fn();
const mockRetrieve = jest.fn();
const mockCollections = jest.fn();
const mockPerform  = jest.fn();

jest.mock('typesense', () => ({
    Client: jest.fn().mockImplementation(() => ({
        collections:  mockCollections,
        multiSearch:  { perform: mockPerform }
    }))
}));

let ts; // fresh module instance per test

beforeEach(() => {
    jest.resetModules();
    // Clear all mock state
    mockUpsert.mockReset();
    mockDelete.mockReset();
    mockDocuments.mockReset();
    mockCreate.mockReset();
    mockRetrieve.mockReset();
    mockCollections.mockReset();
    mockPerform.mockReset();

    // Re-require after reset so module-level vars (client, isConnected) start fresh
    ts = require('../../utils/typesense');
});

// ═══════════════════════════════════════════════════════════════════════════
//  isTypesenseReady
// ═══════════════════════════════════════════════════════════════════════════

describe('isTypesenseReady', () => {
    it('returns false before initTypesense is called', () => {
        expect(ts.isTypesenseReady()).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  initTypesense
// ═══════════════════════════════════════════════════════════════════════════

describe('initTypesense', () => {
    it('sets isConnected to true when all collections are reachable', async () => {
        mockCollections.mockReturnValue({ retrieve: jest.fn().mockResolvedValue({}) });

        await ts.initTypesense();

        expect(ts.isTypesenseReady()).toBe(true);
    });

    it('creates a collection when retrieve returns httpStatus 404', async () => {
        mockCreate.mockResolvedValue({});
        // retrieve throws 404; create succeeds
        mockCollections.mockImplementation((name) => {
            if (name) {
                return {
                    retrieve: jest.fn().mockRejectedValue({ httpStatus: 404 }),
                    documents: mockDocuments
                };
            }
            return { create: mockCreate };
        });

        await ts.initTypesense();

        expect(ts.isTypesenseReady()).toBe(true);
        expect(mockCreate).toHaveBeenCalled();
    });

    it('sets isConnected to false and does NOT throw when Typesense is unreachable', async () => {
        mockCollections.mockReturnValue({
            retrieve: jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))
        });

        await expect(ts.initTypesense()).resolves.not.toThrow();
        expect(ts.isTypesenseReady()).toBe(false);
    });

    it('sets isConnected to false on unexpected errors', async () => {
        mockCollections.mockReturnValue({
            retrieve: jest.fn().mockRejectedValue({ httpStatus: 500, message: 'Server error' })
        });

        await ts.initTypesense();
        expect(ts.isTypesenseReady()).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  petToDoc — document mapper
// ═══════════════════════════════════════════════════════════════════════════

describe('petToDoc', () => {
    it('maps all fields correctly from a Mongoose pet document', () => {
        const pet = {
            _id:         { toString: () => 'abc123' },
            name:        'Buddy',
            breed:       'Labrador',
            category:    'Dog',
            price:       5000,
            age:         '2',
            gender:      'male',
            description: 'Friendly dog',
            available:   true,
            images:      [{ url: 'https://cdn.example.com/img.jpg' }],
            createdAt:   new Date('2024-01-01')
        };

        const doc = ts.petToDoc(pet);

        expect(doc.id).toBe('abc123');
        expect(doc.name).toBe('Buddy');
        expect(doc.breed).toBe('Labrador');
        expect(doc.category).toBe('Dog');
        expect(doc.price).toBe(5000);
        expect(doc.age).toBe('2');
        expect(doc.gender).toBe('male');
        expect(doc.available).toBe(true);
        expect(doc.thumbnail).toBe('https://cdn.example.com/img.jpg');
        expect(typeof doc.createdAt).toBe('number');
    });

    it('returns empty strings for missing optional fields', () => {
        const pet = {
            _id:      { toString: () => 'xyz' },
            name:     'Cat', breed: 'Persian', category: 'Cat',
            price:    2000, gender: 'female', available: true, images: []
        };

        const doc = ts.petToDoc(pet);

        expect(doc.description).toBe('');
        expect(doc.thumbnail).toBe('');
        expect(doc.age).toBe('');
    });

    it('uses Date.now() when createdAt is not set', () => {
        const before = Date.now();
        const pet = {
            _id: { toString: () => 'p1' }, name: 'X', breed: 'Y', category: 'Z',
            price: 100, gender: 'male', available: true, images: []
        };

        const doc = ts.petToDoc(pet);
        const after = Date.now();

        expect(doc.createdAt).toBeGreaterThanOrEqual(before);
        expect(doc.createdAt).toBeLessThanOrEqual(after);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  productToDoc — document mapper
// ═══════════════════════════════════════════════════════════════════════════

describe('productToDoc', () => {
    it('maps all fields correctly', () => {
        const product = {
            _id:         { toString: () => 'prod1' },
            name:        'Dog Food',
            brand:       'Royal Canin',
            category:    'Pet Food',
            price:       1000,
            discount:    10,
            stock:       50,
            description: 'Nutritious',
            avgRating:   4.5,
            isActive:    true,
            images:      [{ url: 'https://cdn.example.com/prod.jpg' }],
            createdAt:   new Date()
        };

        const doc = ts.productToDoc(product);

        expect(doc.id).toBe('prod1');
        expect(doc.name).toBe('Dog Food');
        expect(doc.discount).toBe(10);
        expect(doc.stock).toBe(50);
        expect(doc.isActive).toBe(true);
        expect(doc.avgRating).toBe(4.5);
        expect(doc.thumbnail).toBe('https://cdn.example.com/prod.jpg');
    });

    it('defaults isActive to true when not explicitly false', () => {
        const product = {
            _id: { toString: () => 'p' }, name: 'X', brand: '', category: 'Y',
            price: 100, discount: 0, stock: 5, images: []
        };

        const doc = ts.productToDoc(product);
        expect(doc.isActive).toBe(true);
    });

    it('sets isActive false when product.isActive is false', () => {
        const product = {
            _id: { toString: () => 'p' }, name: 'X', brand: '', category: 'Y',
            price: 100, discount: 0, stock: 0, images: [], isActive: false
        };

        const doc = ts.productToDoc(product);
        expect(doc.isActive).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  serviceToDoc — document mapper
// ═══════════════════════════════════════════════════════════════════════════

describe('serviceToDoc', () => {
    it('maps service provider user document correctly', () => {
        const user = {
            _id:                { toString: () => 'svc1' },
            fullName:           'Dr. Smith',
            serviceType:        'Veterinarian',
            serviceAddress:     '123 Main St',
            serviceDescription: 'Experienced vet',
            experienceYears:    10,
            createdAt:          new Date()
        };

        const doc = ts.serviceToDoc(user);

        expect(doc.id).toBe('svc1');
        expect(doc.name).toBe('Dr. Smith');
        expect(doc.serviceType).toBe('Veterinarian');
        expect(doc.experienceYears).toBe(10);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  syncPet
// ═══════════════════════════════════════════════════════════════════════════

describe('syncPet', () => {
    const fakePet = {
        _id: { toString: () => 'pet1' },
        name: 'Buddy', breed: 'Lab', category: 'Dog',
        price: 5000, gender: 'male', available: true, images: []
    };

    it('is a no-op and does not throw when Typesense is not connected', async () => {
        // isConnected = false (fresh module, initTypesense not called)
        await expect(ts.syncPet(fakePet)).resolves.not.toThrow();
        expect(mockCollections).not.toHaveBeenCalled();
    });

    it('calls collections().documents().upsert() when connected', async () => {
        mockUpsert.mockResolvedValue({});
        mockDocuments.mockReturnValue({ upsert: mockUpsert });
        mockCollections.mockReturnValue({
            retrieve:  jest.fn().mockResolvedValue({}),
            documents: mockDocuments
        });

        await ts.initTypesense(); // sets isConnected = true
        await ts.syncPet(fakePet);

        expect(mockDocuments).toHaveBeenCalled();
        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'pet1', name: 'Buddy' })
        );
    });

    it('swallows errors — does not throw when upsert fails', async () => {
        mockUpsert.mockRejectedValue(new Error('upsert failed'));
        mockDocuments.mockReturnValue({ upsert: mockUpsert });
        mockCollections.mockReturnValue({
            retrieve:  jest.fn().mockResolvedValue({}),
            documents: mockDocuments
        });

        await ts.initTypesense();
        await expect(ts.syncPet(fakePet)).resolves.not.toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  deletePet
// ═══════════════════════════════════════════════════════════════════════════

describe('deletePet', () => {
    it('is a no-op when not connected', async () => {
        await expect(ts.deletePet('some-id')).resolves.not.toThrow();
        expect(mockCollections).not.toHaveBeenCalled();
    });

    it('calls collections().documents(id).delete() when connected', async () => {
        mockDelete.mockResolvedValue({});
        mockDocuments.mockReturnValue({ delete: mockDelete });
        mockCollections.mockReturnValue({
            retrieve:  jest.fn().mockResolvedValue({}),
            documents: mockDocuments
        });

        await ts.initTypesense();
        await ts.deletePet('pet-to-delete');

        expect(mockDocuments).toHaveBeenCalledWith('pet-to-delete');
        expect(mockDelete).toHaveBeenCalled();
    });

    it('ignores 404 errors (document already absent)', async () => {
        mockDelete.mockRejectedValue({ httpStatus: 404 });
        mockDocuments.mockReturnValue({ delete: mockDelete });
        mockCollections.mockReturnValue({
            retrieve:  jest.fn().mockResolvedValue({}),
            documents: mockDocuments
        });

        await ts.initTypesense();
        await expect(ts.deletePet('ghost-id')).resolves.not.toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  multiSearch
// ═══════════════════════════════════════════════════════════════════════════

describe('multiSearch', () => {
    const COLLECTIONS = ['pets', 'products', 'services', 'events', 'mates'];

    beforeEach(async () => {
        // Make initTypesense succeed so isConnected = true and client is set
        mockCollections.mockReturnValue({ retrieve: jest.fn().mockResolvedValue({}) });
        await ts.initTypesense();
    });

    it('calls client.multiSearch.perform with correct searches array', async () => {
        mockPerform.mockResolvedValue({ results: COLLECTIONS.map(() => ({ hits: [] })) });

        await ts.multiSearch('buddy', COLLECTIONS, 10);

        expect(mockPerform).toHaveBeenCalledWith(
            expect.objectContaining({ searches: expect.any(Array) }),
            {}
        );
        const { searches } = mockPerform.mock.calls[0][0];
        expect(searches).toHaveLength(5);
        expect(searches[0].collection).toBe('pets');
        expect(searches[0].q).toBe('buddy');
    });

    it('returns results shaped by collection name', async () => {
        mockPerform.mockResolvedValue({
            results: [
                { hits: [{ document: { id: 'p1', name: 'Buddy', breed: 'Lab' }, text_match: 99 }] },
                { hits: [] }, { hits: [] }, { hits: [] }, { hits: [] }
            ]
        });

        const result = await ts.multiSearch('buddy', COLLECTIONS, 10);

        expect(result.pets).toHaveLength(1);
        expect(result.pets[0].id).toBe('p1');
        expect(result.products).toHaveLength(0);
    });

    it('attaches text_match score to each result document', async () => {
        mockPerform.mockResolvedValue({
            results: [
                { hits: [{ document: { id: 'p1', name: 'Max' }, text_match: 75 }] },
                { hits: [] }, { hits: [] }, { hits: [] }, { hits: [] }
            ]
        });

        const result = await ts.multiSearch('max', COLLECTIONS, 5);
        expect(result.pets[0].score).toBe(75);
    });

    it('returns empty arrays for all categories when no hits', async () => {
        mockPerform.mockResolvedValue({
            results: COLLECTIONS.map(() => ({ hits: [] }))
        });

        const result = await ts.multiSearch('xyznotfound', COLLECTIONS, 10);

        COLLECTIONS.forEach(c => {
            expect(result[c]).toHaveLength(0);
        });
    });

    it('searches only the requested subset of collections', async () => {
        mockPerform.mockResolvedValue({
            results: [{ hits: [] }, { hits: [] }]
        });

        await ts.multiSearch('food', ['pets', 'products'], 5);

        const { searches } = mockPerform.mock.calls[0][0];
        expect(searches).toHaveLength(2);
        expect(searches.map(s => s.collection)).toEqual(['pets', 'products']);
    });
});
