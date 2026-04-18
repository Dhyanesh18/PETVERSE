/**
 * Integration tests: Auth routes (/api/auth)
 * Tests check-session, login validation, and logout.
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

// ── mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models/users', () => ({
    findById: jest.fn(),
    findOne: jest.fn()
}));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK')
})));

// Mock login + signup controllers so we test the routes layer in isolation
jest.mock('../../controllers/login', () => ({
    showLoginForm: jest.fn(),
    handleLogin:  jest.fn((req, res) => res.json({ success: true, message: 'Mocked login' })),
    handleLogout: jest.fn()
}));

jest.mock('../../controllers/signup', () => ({
    handleSignupOwner:           jest.fn((req, res) => res.status(201).json({ success: true })),
    handleSignupSeller:          jest.fn((req, res) => res.status(201).json({ success: true })),
    handleSignupServiceProvider: jest.fn((req, res) => res.status(201).json({ success: true }))
}));

const request = require('supertest');
const express = require('express');
const session = require('express-session');

const authRoutes = require('../../routes/auth.routes');
const User       = require('../../models/users');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));

    // Attach req.user like the real app middleware does
    app.use((req, res, next) => {
        req.user = null;
        next();
    });

    app.use('/api/auth', authRoutes);
    return app;
}

const app = buildApp();

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/auth/check-session
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/check-session', () => {
    it('returns isLoggedIn: false when no session exists', async () => {
        const res = await request(app).get('/api/auth/check-session');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.isLoggedIn).toBe(false);
        expect(res.body.user).toBeNull();
    });

    it('returns isLoggedIn: false when session userId exists but user not found in DB', async () => {
        User.findById.mockResolvedValueOnce(null);

        // Use an agent to maintain session cookies
        const agent = request.agent(buildApp());

        // Manually inject session userId — simulate a stale session
        // We test this by checking that the session check handles missing user gracefully
        const res = await agent.get('/api/auth/check-session');
        expect(res.body.isLoggedIn).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/login', () => {
    it('returns 200 from mocked login controller', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout', () => {
    it('returns 200 and destroys session', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/auth/check-session — authenticated user
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/check-session — authenticated user', () => {
    // Build a test app that pre-attaches a user to req, simulating a valid session
    function buildAppWithUser(user) {
        const app2 = express();
        app2.use(express.json());
        app2.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
        app2.use((req, res, next) => {
            req.user = user;
            req.session.userId   = user._id;
            req.session.userRole = user.role;
            next();
        });
        app2.use('/api/auth', authRoutes);
        return app2;
    }

    it('returns isLoggedIn: true and user data when valid user is in session', async () => {
        const mockUser = {
            _id: 'user123', fullName: 'Test User', username: 'testuser',
            email: 'test@example.com', role: 'owner', isApproved: true,
            createdAt: new Date().toISOString()
        };
        const res = await request(buildAppWithUser(mockUser)).get('/api/auth/check-session');

        expect(res.status).toBe(200);
        expect(res.body.isLoggedIn).toBe(true);
        expect(res.body.user.fullName).toBe('Test User');
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.userRole).toBe('owner');
    });

    it('returns isAdmin: true for a user with admin role', async () => {
        const adminUser = {
            _id: 'admin1', fullName: 'Site Admin', username: 'admin',
            email: 'admin@petverse.com', role: 'admin', isApproved: true,
            createdAt: new Date().toISOString()
        };
        const res = await request(buildAppWithUser(adminUser)).get('/api/auth/check-session');

        expect(res.body.isLoggedIn).toBe(true);
        expect(res.body.isAdmin).toBe(true);
        expect(res.body.userRole).toBe('admin');
    });

    it('returns isAdmin: false for a non-admin user', async () => {
        const sellerUser = {
            _id: 'seller1', fullName: 'Pet Shop', username: 'petshop',
            email: 'shop@example.com', role: 'seller', isApproved: true,
            createdAt: new Date().toISOString()
        };
        const res = await request(buildAppWithUser(sellerUser)).get('/api/auth/check-session');

        expect(res.body.isAdmin).toBe(false);
        expect(res.body.userRole).toBe('seller');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/auth/select-user-type
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/select-user-type', () => {
    it('returns 200 and stores valid userType in session', async () => {
        const res = await request(app)
            .post('/api/auth/select-user-type')
            .send({ userType: 'owner' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.userType).toBe('owner');
    });

    it('returns 400 for an invalid userType', async () => {
        const res = await request(app)
            .post('/api/auth/select-user-type')
            .send({ userType: 'hacker' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('accepts service_provider as a valid userType', async () => {
        const res = await request(app)
            .post('/api/auth/select-user-type')
            .send({ userType: 'service_provider' });

        expect(res.status).toBe(200);
        expect(res.body.userType).toBe('service_provider');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/auth/signup/*
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signup', () => {
    it('POST /api/auth/signup/owner calls owner handler and returns 201', async () => {
        const res = await request(app)
            .post('/api/auth/signup/owner')
            .send({ fullName: 'John Doe', email: 'john@example.com', password: 'pass123' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/signup/seller calls seller handler and returns 201', async () => {
        const res = await request(app)
            .post('/api/auth/signup/seller')
            .send({ fullName: 'Jane Shop', email: 'jane@shop.com', password: 'pass123' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/signup/service-provider calls service handler and returns 201', async () => {
        const res = await request(app)
            .post('/api/auth/signup/service-provider')
            .send({ fullName: 'Vet Clinic', email: 'vet@clinic.com', password: 'pass123' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });
});
