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
            description: 'PetVerse backend API documentation'
        },
        servers: [{
            url: serverUrl,
            description: 'Local / configured server'
        }],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'petverse.sid'
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
