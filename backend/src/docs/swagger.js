const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

function normalizePathSegment(segment) {
    if (!segment) return '';
    return segment.startsWith('/') ? segment : `/${segment}`;
}

function regexToMountPath(layerRegexp) {
    // Express stores mount paths as regex like:
    //   /^\/api\/auth\/?(?=\/|$)/i
    // For complex patterns we fall back to empty prefix.
    if (!layerRegexp) return '';
    if (layerRegexp.fast_slash) return '';

    const source = layerRegexp.source;
    if (!source) return '';

    // Strip anchors.
    let s = source;
    if (s.startsWith('^')) s = s.slice(1);

    // Express commonly appends a lookahead and optional trailing slash:
    //   \/?(?=\/|$)
    // Remove these first so we don't mis-detect them as "complex" regex.
    s = s
        .replace(/\\\/\?\(\?=\\\/\|\$\)/g, '')
        .replace(/\(\?=\\\/\|\$\)/g, '')
        .replace(/\$\/?$/, '');

    // Remove leading escaped slash.
    s = s.replace(/^\\\//, '');

    // If it still contains regex constructs or capture groups, we can’t reliably
    // reconstruct it. Treat it as empty prefix.
    if (/[()\[\]|+*?]/.test(s)) {
        return '';
    }

    const decoded = s.replace(/\\\//g, '/');
    return normalizePathSegment(decoded);
}

function collectRoutesFromStack(stack, basePath = '') {
    const routes = [];

    for (const layer of stack || []) {
        if (!layer) continue;

        // Direct route
        if (layer.route && layer.route.path) {
            const routePaths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
            const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);

            for (const routePath of routePaths) {
                const fullPath = `${basePath}${normalizePathSegment(routePath)}`.replace(/\/\/{2,}/g, '/');
                routes.push({ path: fullPath, methods });
            }
            continue;
        }

        // Router middleware with nested stack
        if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            const mountPath = regexToMountPath(layer.regexp);
            routes.push(...collectRoutesFromStack(layer.handle.stack, `${basePath}${mountPath}`));
        }
    }

    return routes;
}

function listExpressRoutes(app) {
    if (!app || !app._router || !app._router.stack) return [];
    return collectRoutesFromStack(app._router.stack, '');
}

function tagFromPath(routePath) {
    // e.g. /api/auth/login -> auth
    const parts = (routePath || '').split('/').filter(Boolean);
    const apiIndex = parts.indexOf('api');
    if (apiIndex >= 0 && parts[apiIndex + 1]) return parts[apiIndex + 1];
    return parts[0] || 'api';
}

function shouldRequireAuth(routePath) {
    // Heuristic: most modules except public catalog/auth endpoints require auth.
    // This doesn't enforce security at runtime; it only documents it.
    if (!routePath) return false;
    if (routePath === '/api' || routePath === '/api/health') return false;

    const publicPrefixes = [
        '/api/auth',
        '/api/featured-pets',
        '/api/featured-products',
        '/api/pets',
        '/api/products',
        '/api/services',
        '/api/events',
        '/api/search',
        '/api/images'
    ];

    if (publicPrefixes.some((p) => routePath === p || routePath.startsWith(`${p}/`))) {
        // Some sub-routes may still be protected; keep docs permissive by default.
        return false;
    }

    const protectedPrefixes = [
        '/api/admin',
        '/api/user',
        '/api/seller',
        '/api/service-provider',
        '/api/cart',
        '/api/booking',
        '/api/payment',
        '/api/wishlist',
        '/api/reviews',
        '/api/lost-pets',
        '/api/otp',
        '/api/forgot-password'
    ];

    return protectedPrefixes.some((p) => routePath === p || routePath.startsWith(`${p}/`));
}

function toOperationId(method, openapiPath) {
    return `${method.toLowerCase()}_${String(openapiPath)
        .replace(/^\//, '')
        .replace(/\{([^}]+)\}/g, 'by_$1')
        .replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function extractOpenApiPathParams(openapiPath) {
    const params = [];
    const regex = /\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(openapiPath)) !== null) {
        params.push(match[1]);
    }
    return params;
}

function openApiPathsFromExpressPath(expressPath) {
    // Convert Express style:
    //  /api/pets/:id/image/:imageIndex?
    // to OpenAPI paths:
    //  /api/pets/{id}/image
    //  /api/pets/{id}/image/{imageIndex}
    const segments = String(expressPath || '').split('/').filter((s) => s.length > 0);

    // Build variants to expand optional path params.
    let variants = [[]];
    for (const seg of segments) {
        if (seg.startsWith(':') && seg.endsWith('?')) {
            const name = seg.slice(1, -1);
            const withParam = variants.map((v) => [...v, `{${name}}`]);
            const withoutParam = variants.map((v) => [...v]);
            variants = [...withoutParam, ...withParam];
            continue;
        }

        if (seg.startsWith(':')) {
            const name = seg.slice(1);
            variants = variants.map((v) => [...v, `{${name}}`]);
            continue;
        }

        variants = variants.map((v) => [...v, seg]);
    }

    // Normalize and re-add leading slash.
    const paths = [...new Set(variants.map((v) => `/${v.join('/')}`))];
    return paths;
}

function buildDiscoveredPaths(app) {
    const discovered = listExpressRoutes(app);
    const paths = {};

    for (const { path: routePath, methods } of discovered) {
        if (!routePath || !routePath.startsWith('/api')) continue;
        if (routePath.startsWith('/api/docs')) continue;

        const openapiPaths = openApiPathsFromExpressPath(routePath);
        for (const openapiPath of openapiPaths) {
            if (!paths[openapiPath]) paths[openapiPath] = {};

            const tag = tagFromPath(routePath);
            const requiresAuth = shouldRequireAuth(routePath);
            const pathParamNames = extractOpenApiPathParams(openapiPath);
            const parameters = pathParamNames.map((name) => ({
                name,
                in: 'path',
                required: true,
                schema: { type: 'string' }
            }));

            for (const method of methods || []) {
                const m = method.toLowerCase();
                if (paths[openapiPath][m]) continue;

                const operation = {
                    tags: [tag],
                    operationId: toOperationId(m, openapiPath),
                    summary: `${m.toUpperCase()} ${openapiPath}`,
                    parameters,
                    responses: {
                        200: {
                            description: 'OK',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Bad Request',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiError' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiError' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiError' }
                                }
                            }
                        },
                        404: {
                            description: 'Not Found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiError' }
                                }
                            }
                        },
                        500: {
                            description: 'Server Error',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiError' }
                                }
                            }
                        }
                    }
                };

                if (requiresAuth) {
                    operation.security = [{ bearerAuth: [] }, { cookieAuth: [] }];
                }

                if (['post', 'put', 'patch'].includes(m)) {
                    operation.requestBody = {
                        required: false,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    additionalProperties: true
                                }
                            }
                        }
                    };
                }

                paths[openapiPath][m] = operation;
            }
        }
    }

    return paths;
}

function buildSwaggerSpec(app) {
    const port = process.env.PORT || 8080;
    const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

    const definition = {
        openapi: '3.0.0',
        info: {
            title: 'PetVerse API',
            version: '1.0.0',
            description: 'PetVerse backend API documentation'
        },
        servers: [{
            url: serverUrl,
            description: 'Local / configured server'
        }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'petverse.sid'
                }
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Generic JSON response envelope used by the API.'
                },
                ApiError: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Generic error payload returned by the API.'
                }
            }
        }
    };

    const spec = swaggerJSDoc({
        definition,
        apis: [
            path.join(__dirname, '../routes/*.js'),
            path.join(__dirname, '../controllers/*.js'),
            path.join(__dirname, '../models/*.js')
        ]
    });

    // Auto-discover Express endpoints so the spec has paths even if
    // route files don’t yet have detailed @swagger JSDoc blocks.
    const discoveredPaths = buildDiscoveredPaths(app);
    spec.paths = { ...(discoveredPaths || {}), ...(spec.paths || {}) };

    return spec;
}

function setupSwagger(app) {
    app.get('/api/docs.json', (req, res) => {
        const swaggerSpec = buildSwaggerSpec(app);
        res.setHeader('Content-Type', 'application/json');
        if (process.env.NODE_ENV !== 'production') {
            res.setHeader('Cache-Control', 'no-store');
        }
        res.status(200).json(swaggerSpec);
    });

    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(null, {
            explorer: true,
            swaggerOptions: {
                url: '/api/docs.json',
                persistAuthorization: true,
                displayRequestDuration: true,
                requestInterceptor: (req) => {
                    // Ensure session cookies are sent with "Try it out" requests.
                    req.credentials = 'include';
                    return req;
                }
            }
        })
    );

    return null;
}

module.exports = {
    buildSwaggerSpec,
    setupSwagger
};
