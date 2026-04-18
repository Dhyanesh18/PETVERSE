/**
 * Jest setup file — runs before all tests.
 * Sets NODE_ENV to 'test' so the app skips Redis initialisation.
 */
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.MONGODB_URI = ''; // prevent real DB connection in unit tests
process.env.B2B_API_KEYS = 'test-api-key-123';
