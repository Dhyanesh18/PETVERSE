const Redis = require('ioredis');

let client = null;
let isConnected = false;

function getClient() {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: true,
        enableOfflineQueue: false,
        // Back off aggressively so we don't spam the console when Redis is absent
        retryStrategy: (times) => Math.min(times * 2000, 30000)
    });

    client.on('connect', () => {
        isConnected = true;
        console.log('[Redis] Connected');
    });

    client.on('error', (err) => {
        isConnected = false;
        // Don't crash — Redis is optional (graceful degradation)
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[Redis] Connection error (caching disabled):', err.message);
        }
    });

    client.on('close', () => {
        isConnected = false;
    });

    // Attempt to connect
    client.connect().catch(() => {});

    return client;
}

/**
 * Get a cached value. Returns null if not found or Redis unavailable.
 */
async function cacheGet(key) {
    try {
        const c = getClient();
        if (!isConnected) return null;
        const value = await c.get(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

/**
 * Set a cache value with a TTL in seconds.
 */
async function cacheSet(key, value, ttlSeconds = 300) {
    try {
        const c = getClient();
        if (!isConnected) return;
        await c.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // Ignore — Redis unavailable, proceed without caching
    }
}

/**
 * Delete a cache key.
 */
async function cacheDel(key) {
    try {
        const c = getClient();
        if (!isConnected) return;
        await c.del(key);
    } catch {
        // Ignore
    }
}

/**
 * Delete all keys matching a pattern (e.g. "pets:*").
 */
async function cacheInvalidatePattern(pattern) {
    try {
        const c = getClient();
        if (!isConnected) return;
        const keys = await c.keys(pattern);
        if (keys.length > 0) {
            await c.del(...keys);
        }
    } catch {
        // Ignore
    }
}

/**
 * Returns true when the Redis client is actively connected.
 */
function isRedisConnected() {
    return isConnected;
}

module.exports = {
    getClient,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheInvalidatePattern,
    isRedisConnected
};
