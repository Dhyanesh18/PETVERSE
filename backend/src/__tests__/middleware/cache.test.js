/**
 * Unit tests: cache middleware (middleware/cache.js)
 */

// Mock redis utils so we don't need a real connection
jest.mock('../../utils/redis', () => ({
    cacheGet: jest.fn(),
    cacheSet: jest.fn()
}));

const { cacheGet, cacheSet } = require('../../utils/redis');
const { cacheMiddleware } = require('../../middleware/cache');

function buildMockRes(statusCode = 200) {
    const res = {
        statusCode,
        headers: {},
        setHeader: jest.fn(function(k, v) { this.headers[k] = v; return this; }),
        json: jest.fn(function(body) { this._body = body; return this; }),
    };
    return res;
}

function buildMockReq(query = {}) {
    return { method: 'GET', query };
}

describe('cacheMiddleware', () => {
    afterEach(() => jest.clearAllMocks());

    it('calls next() for non-GET requests without touching cache', async () => {
        const middleware = cacheMiddleware('test', 60);
        const req = { method: 'POST', query: {} };
        const res = buildMockRes();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(cacheGet).not.toHaveBeenCalled();
    });

    it('returns cached response with X-Cache: HIT header when cache is warm', async () => {
        const cached = { success: true, data: { pets: [] } };
        cacheGet.mockResolvedValueOnce(cached);

        const middleware = cacheMiddleware('pets', 300);
        const req = buildMockReq({ page: '1' });
        const res = buildMockRes();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
        expect(res.json).toHaveBeenCalledWith(cached);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next() on cache MISS and patches res.json to cache the response', async () => {
        cacheGet.mockResolvedValueOnce(null);
        cacheSet.mockResolvedValueOnce(undefined);

        const middleware = cacheMiddleware('products', 300);
        const req = buildMockReq({ page: '1' });
        const res = buildMockRes(200);
        const next = jest.fn();

        await middleware(req, res, next);
        expect(next).toHaveBeenCalled();

        // Simulate route handler calling res.json
        const responseBody = { success: true, data: { products: [{ id: 1 }] } };
        res.json(responseBody);

        expect(res.headers['X-Cache']).toBe('MISS');
        expect(cacheSet).toHaveBeenCalledWith(
            expect.stringContaining('products:'),
            responseBody,
            300
        );
    });

    it('does not cache error responses (status >= 400)', async () => {
        cacheGet.mockResolvedValueOnce(null);

        const middleware = cacheMiddleware('services', 300);
        const req = buildMockReq();
        const res = buildMockRes(500);
        const next = jest.fn();

        await middleware(req, res, next);
        res.json({ success: false, error: 'DB error' });

        expect(cacheSet).not.toHaveBeenCalled();
    });

    it('uses different cache keys for different query strings', async () => {
        cacheGet.mockResolvedValue(null);
        const keys = [];
        cacheGet.mockImplementation((key) => { keys.push(key); return Promise.resolve(null); });

        const middleware = cacheMiddleware('pets', 300);
        const next = jest.fn();

        await middleware(buildMockReq({ page: '1' }), buildMockRes(), next);
        await middleware(buildMockReq({ page: '2' }), buildMockRes(), next);

        expect(keys[0]).not.toBe(keys[1]);
    });
});
