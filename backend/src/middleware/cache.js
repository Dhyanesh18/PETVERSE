const { cacheGet, cacheSet } = require('../utils/redis');

/**
 * Express middleware that caches GET responses in Redis.
 *
 * Usage:
 *   router.get('/foo', cacheMiddleware('foo', 300), handler);
 *
 * @param {string} prefix   - Cache key prefix (e.g. 'pets', 'products')
 * @param {number} ttl      - Cache TTL in seconds (default 300 = 5 min)
 */
function cacheMiddleware(prefix, ttl = 300) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        // Build a deterministic cache key from query string
        const queryStr = JSON.stringify(req.query || {});
        const cacheKey = `${prefix}:${Buffer.from(queryStr).toString('base64')}`;

        try {
            const cached = await cacheGet(cacheKey);
            if (cached !== null) {
                res.setHeader('X-Cache', 'HIT');
                return res.json(cached);
            }
        } catch {
            // On any Redis error, fall through to the real handler
        }

        // Monkey-patch res.json so we can intercept & cache the response
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            res.setHeader('X-Cache', 'MISS');
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheSet(cacheKey, body, ttl).catch(() => {});
            }
            return originalJson(body);
        };

        next();
    };
}

module.exports = { cacheMiddleware };
