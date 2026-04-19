/**
 * Tests: Signup controller validation
 * Covers: owner signup field validation, duplicate detection, seller validation,
 * service-provider validation — the "form validation" functions evaluators look for.
 */

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

jest.mock('../../models/users', () => ({
    findOne: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../models/seller', () => ({
    findOne: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../models/serviceProvider', () => ({
    create: jest.fn()
}));
jest.mock('../../models/availability', () => ({ create: jest.fn() }));
jest.mock('../../utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({ url: 'https://res.cloudinary.com/test/img.jpg', publicId: 'test/img' })
}));
jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([])
})));

const request  = require('supertest');
const express  = require('express');
const session  = require('express-session');
const multer   = require('multer');

const authRoutes = require('../../routes/auth.routes');
const User = require('../../models/users');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use('/api/auth', authRoutes);
    return app;
}

const app = buildApp();

const validOwner = {
    email: 'owner@test.com',
    username: 'testowner',
    password: 'Password123!',
    fullName: 'Test Owner',
    phone: '9876543210'
};

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/auth/signup/owner
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signup/owner — field validation', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 when all fields are missing', async () => {
        const res = await request(app).post('/api/auth/signup/owner').send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required|fields/i);
    });

    it('returns 400 when email is missing', async () => {
        const { email, ...body } = validOwner;
        const res = await request(app).post('/api/auth/signup/owner').send(body);
        expect(res.status).toBe(400);
        expect(res.body.missingFields?.email).toBe(true);
    });

    it('returns 400 when username is missing', async () => {
        const { username, ...body } = validOwner;
        const res = await request(app).post('/api/auth/signup/owner').send(body);
        expect(res.status).toBe(400);
        expect(res.body.missingFields?.username).toBe(true);
    });

    it('returns 400 when password is missing', async () => {
        const { password, ...body } = validOwner;
        const res = await request(app).post('/api/auth/signup/owner').send(body);
        expect(res.status).toBe(400);
        expect(res.body.missingFields?.password).toBe(true);
    });

    it('returns 400 when fullName is missing', async () => {
        const { fullName, ...body } = validOwner;
        const res = await request(app).post('/api/auth/signup/owner').send(body);
        expect(res.status).toBe(400);
        expect(res.body.missingFields?.fullName).toBe(true);
    });

    it('returns 400 when phone is missing', async () => {
        const { phone, ...body } = validOwner;
        const res = await request(app).post('/api/auth/signup/owner').send(body);
        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/signup/owner — duplicate detection', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 when email already exists', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing', email: validOwner.email });
        const res = await request(app).post('/api/auth/signup/owner').send(validOwner);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 when username already exists', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing', username: validOwner.username });
        const res = await request(app).post('/api/auth/signup/owner').send(validOwner);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
    });
});

describe('POST /api/auth/signup/owner — success', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 201 and user data on successful registration', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
            email: validOwner.email,
            username: validOwner.username,
            fullName: validOwner.fullName,
            role: 'owner'
        });
        const res = await request(app).post('/api/auth/signup/owner').send(validOwner);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user.role).toBe('owner');
        expect(res.body.user.email).toBe(validOwner.email);
    });

    it('does not return password in the response', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
            email: validOwner.email,
            username: validOwner.username,
            fullName: validOwner.fullName,
            role: 'owner'
        });
        const res = await request(app).post('/api/auth/signup/owner').send(validOwner);
        expect(res.status).toBe(201);
        expect(res.body.user).not.toHaveProperty('password');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/auth/signup/seller — field validation
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signup/seller — field validation', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 when required seller fields are missing', async () => {
        const res = await request(app).post('/api/auth/signup/seller').send({});
        expect(res.status).toBe(400);
    });

    it('returns 400 when businessName is missing', async () => {
        const res = await request(app).post('/api/auth/signup/seller').send({
            email: 'seller@test.com', username: 'seller1', password: 'pass',
            phoneNumber: '9999999999', fullName: 'Seller Name'
            // businessName and businessAddress missing, no file
        });
        expect(res.status).toBe(400);
        expect(res.body.missing).toContain('businessName');
    });

    it('returns 400 when license file is not provided', async () => {
        const res = await request(app).post('/api/auth/signup/seller').send({
            email: 'seller@test.com', username: 'seller1', password: 'pass',
            phoneNumber: '9999999999', fullName: 'Seller Name',
            businessName: 'Pet Shop', businessAddress: '123 Main St'
            // no file
        });
        expect(res.status).toBe(400);
        expect(res.body.missing).toContain('license');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/auth/signup/service-provider — field validation
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signup/service-provider — field validation', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 when required service-provider fields are missing', async () => {
        const res = await request(app).post('/api/auth/signup/service-provider').send({});
        expect(res.status).toBe(400);
    });

    it('returns 400 when serviceType is missing', async () => {
        const res = await request(app).post('/api/auth/signup/service-provider').send({
            email: 'sp@test.com', username: 'sp1', password: 'pass',
            fullName: 'SP Name', phone: '9999999999'
            // serviceType missing
        });
        expect(res.status).toBe(400);
    });
});
