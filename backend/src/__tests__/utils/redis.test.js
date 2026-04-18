/**
 * Unit tests: Redis utility (utils/redis.js)
 * Mocks ioredis so tests run without a real Redis server.
 */

// ── mock ioredis before requiring the module under test ──────────────────────
const mockRedisClient = {
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
};

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => mockRedisClient);
});

// Force the module to be fresh for each describe block
let redis;

beforeEach(() => {
    jest.resetModules();
    // Re-require after resetting modules so the mock is applied cleanly
    redis = require('../../utils/redis');
    // Simulate connected state
    redis.getClient(); // triggers constructor → on('connect') stub fires manually below
    // Manually set the internal isConnected flag via a successful get call pattern
    mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === 'connect') handler();
        return mockRedisClient;
    });
    // Re-require once more to pick up the 'connect' handler
    jest.resetModules();
    redis = require('../../utils/redis');
    redis.getClient();
});

afterEach(() => {
    jest.clearAllMocks();
});

// ── cacheGet ─────────────────────────────────────────────────────────────────

describe('cacheGet', () => {
    it('returns parsed value when Redis has the key', async () => {
        const payload = { id: 1, name: 'Buddy' };
        mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(payload));

        const result = await redis.cacheGet('pets:test');
        expect(mockRedisClient.get).toHaveBeenCalledWith('pets:test');
        expect(result).toEqual(payload);
    });

    it('returns null when key is not found', async () => {
        mockRedisClient.get.mockResolvedValueOnce(null);

        const result = await redis.cacheGet('pets:missing');
        expect(result).toBeNull();
    });

    it('returns null and does not throw when Redis errors', async () => {
        mockRedisClient.get.mockRejectedValueOnce(new Error('Redis down'));

        const result = await redis.cacheGet('pets:error');
        expect(result).toBeNull();
    });
});

// ── cacheSet ─────────────────────────────────────────────────────────────────

describe('cacheSet', () => {
    it('serialises value and sets TTL', async () => {
        mockRedisClient.set.mockResolvedValueOnce('OK');
        const data = { total: 3, items: ['a', 'b', 'c'] };

        await redis.cacheSet('products:key', data, 120);

        expect(mockRedisClient.set).toHaveBeenCalledWith(
            'products:key',
            JSON.stringify(data),
            'EX',
            120
        );
    });

    it('uses default TTL of 300 when not specified', async () => {
        mockRedisClient.set.mockResolvedValueOnce('OK');

        await redis.cacheSet('services:key', { ok: true });

        expect(mockRedisClient.set).toHaveBeenCalledWith(
            'services:key',
            expect.any(String),
            'EX',
            300
        );
    });

    it('does not throw when Redis errors', async () => {
        mockRedisClient.set.mockRejectedValueOnce(new Error('Redis down'));
        await expect(redis.cacheSet('x', {})).resolves.not.toThrow();
    });
});

// ── cacheDel ─────────────────────────────────────────────────────────────────

describe('cacheDel', () => {
    it('calls del with the correct key', async () => {
        mockRedisClient.del.mockResolvedValueOnce(1);

        await redis.cacheDel('pets:abc');
        expect(mockRedisClient.del).toHaveBeenCalledWith('pets:abc');
    });

    it('does not throw on Redis error', async () => {
        mockRedisClient.del.mockRejectedValueOnce(new Error('down'));
        await expect(redis.cacheDel('anything')).resolves.not.toThrow();
    });
});

// ── cacheInvalidatePattern ───────────────────────────────────────────────────

describe('cacheInvalidatePattern', () => {
    it('deletes all keys matching the pattern', async () => {
        mockRedisClient.keys.mockResolvedValueOnce(['pets:a', 'pets:b']);
        mockRedisClient.del.mockResolvedValueOnce(2);

        await redis.cacheInvalidatePattern('pets:*');

        expect(mockRedisClient.keys).toHaveBeenCalledWith('pets:*');
        expect(mockRedisClient.del).toHaveBeenCalledWith('pets:a', 'pets:b');
    });

    it('skips del call when no keys match', async () => {
        mockRedisClient.keys.mockResolvedValueOnce([]);

        await redis.cacheInvalidatePattern('empty:*');
        expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
});
