/**
 * Redis Performance Benchmark
 * ===========================
 * Measures and reports response-time improvement from Redis caching.
 *
 * Usage:
 *   node src/scripts/redis-benchmark.js
 *
 * Requirements:
 *   - Backend running on http://localhost:8080 (npm run dev in another terminal)
 *   - Redis running on localhost:6379 (or set REDIS_URL env var)
 */

const http = require('http');

const BASE_URL = process.env.API_BASE || 'http://localhost:8080';
const WARMUP_HITS = 1;   // requests that warm the cache
const BENCH_HITS = 10;   // measured requests per endpoint

const ENDPOINTS = [
    { name: 'GET /api/pets',              path: '/api/pets?limit=12' },
    { name: 'GET /api/products',          path: '/api/products?limit=12' },
    { name: 'GET /api/services',          path: '/api/services?limit=12' },
    { name: 'GET /api/featured-pets',     path: '/api/featured-pets' },
    { name: 'GET /api/featured-products', path: '/api/featured-products' }
];

// ── helpers ──────────────────────────────────────────────────────────────────

function httpGet(urlStr) {
    return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        const req = http.get(urlStr, (res) => {
            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
                const elapsed = Number(process.hrtime.bigint() - start) / 1e6; // ms
                resolve({
                    status: res.statusCode,
                    cacheHeader: res.headers['x-cache'] || 'N/A',
                    ms: elapsed
                });
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(new Error('Request timed out')); });
    });
}

async function measureEndpoint(path) {
    const url = `${BASE_URL}${path}`;

    // ── cold (no-cache) measurement: flush the cache key first via a unique query ──
    // We can't flush from here without a Redis client, so instead we rely on the
    // FIRST measured request naturally being a MISS (cache is cold on startup or
    // after the warmup period has elapsed).  For a clean test, restart the server
    // between runs, OR use the --no-redis flag to disable caching.
    //
    // Strategy here: record the FIRST hit (always a MISS = DB hit) as "without Redis",
    // then record the average of the next BENCH_HITS (all HITs) as "with Redis".

    // Step 1: cold request (MISS)
    let coldResult;
    try {
        coldResult = await httpGet(url);
    } catch (err) {
        return { path, error: err.message };
    }

    const coldMs = coldResult.ms;

    // Step 2: warm requests (HITs)
    const warmTimes = [];
    for (let i = 0; i < BENCH_HITS; i++) {
        try {
            const r = await httpGet(url);
            warmTimes.push(r.ms);
        } catch {
            // skip failed requests
        }
    }

    const avgWarm = warmTimes.length
        ? warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length
        : NaN;

    const improvement = coldMs > 0 && !isNaN(avgWarm)
        ? (((coldMs - avgWarm) / coldMs) * 100).toFixed(1)
        : 'N/A';

    return { path, coldMs: coldMs.toFixed(2), avgWarmMs: avgWarm.toFixed(2), improvement };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('='.repeat(70));
    console.log('  PetVerse — Redis Caching Benchmark');
    console.log(`  API base: ${BASE_URL}`);
    console.log(`  Warm hits per endpoint: ${BENCH_HITS}`);
    console.log('='.repeat(70));

    // Check server is up
    try {
        await httpGet(`${BASE_URL}/api/health`);
    } catch {
        console.error(`\n[ERROR] Cannot reach ${BASE_URL}/api/health`);
        console.error('Make sure the backend is running (npm run dev) before running this script.\n');
        process.exit(1);
    }

    const results = [];

    for (const ep of ENDPOINTS) {
        process.stdout.write(`  Benchmarking ${ep.name} ... `);
        const r = await measureEndpoint(ep.path);
        if (r.error) {
            console.log(`ERROR: ${r.error}`);
        } else {
            console.log(`cold=${r.coldMs}ms  warm(avg)=${r.avgWarmMs}ms  improvement=${r.improvement}%`);
        }
        results.push({ ...ep, ...r });
    }

    // ── report ────────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(70));
    console.log('  BENCHMARK REPORT');
    console.log('='.repeat(70));
    console.log(
        `${'Endpoint'.padEnd(35)} ${'Without Redis'.padEnd(16)} ${'With Redis'.padEnd(14)} Improvement`
    );
    console.log('-'.repeat(70));

    for (const r of results) {
        if (r.error) {
            console.log(`${r.name.padEnd(35)} ERROR: ${r.error}`);
        } else {
            const label = r.name.padEnd(35);
            const cold  = `${r.coldMs} ms`.padEnd(16);
            const warm  = `${r.avgWarmMs} ms`.padEnd(14);
            console.log(`${label} ${cold} ${warm} ${r.improvement}%`);
        }
    }

    console.log('='.repeat(70));
    console.log('\nNote: "Without Redis" is the first request (cold cache / DB hit).');
    console.log('"With Redis" is the average of subsequent requests served from cache.');
    console.log();
}

main().catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
});
