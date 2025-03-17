const sqlite3 = require('sqlite3').verbose();

// Open (or create) petverse.db
const db = new sqlite3.Database('./petverse.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to petverse.db');
    }
});

// Create tables
db.serialize(() => {
    // Create users table (common fields)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT NOT NULL,
            full_name TEXT NOT NULL,
            user_type TEXT CHECK(user_type IN ('pet_owner', 'seller', 'service_provider')) NOT NULL
        )
    `);

    // Create sellers table (additional fields for sellers)
    db.run(`
        CREATE TABLE IF NOT EXISTS sellers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            business_name TEXT NOT NULL,
            license_number TEXT UNIQUE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create service providers table (additional fields for service providers)
    db.run(`
        CREATE TABLE IF NOT EXISTS service_providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            service_type TEXT NOT NULL,
            certification_number TEXT UNIQUE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    console.log("Tables created successfully!");
});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});
