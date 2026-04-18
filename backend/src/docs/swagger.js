const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

function buildSwaggerSpec() {
    const port = process.env.PORT || 8080;
    const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

    const definition = {
        openapi: '3.0.0',
        info: {
            title: 'PetVerse API',
            version: '1.0.0',
            description: [
                'PetVerse backend REST API documentation.',
                '',
                '## Authentication',
                '- **B2C endpoints** use session-based auth (cookie `petverse.sid`). Log in via `POST /api/auth/login` first.',
                '- **B2B endpoints** (`/api/b2b/*`) require an `X-API-Key` header.',
                '',
                '## Redis Caching',
                'List endpoints (`/api/pets`, `/api/products`, `/api/services`) are cached in Redis for 5 minutes.',
                'The response header `X-Cache: HIT` indicates a cached response.'
            ].join('\n'),
            contact: { name: 'PetVerse Dev Team' }
        },
        servers: [
            { url: serverUrl, description: process.env.SWAGGER_SERVER_URL ? 'Production' : 'Local development' }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'petverse.sid'
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API key for B2B machine-to-machine access. Configure valid keys via B2B_API_KEYS env var.'
                }
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object', additionalProperties: true }
                    }
                },
                ApiError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
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

    return spec;
}

function setupSwagger(app) {
    const swaggerSpec = buildSwaggerSpec();

    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(swaggerSpec);
    });

    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true
            }
        })
    );

    return swaggerSpec;
}

module.exports = {
    buildSwaggerSpec,
    setupSwagger
};
