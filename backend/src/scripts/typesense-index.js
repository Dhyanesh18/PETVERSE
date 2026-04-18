/**
 * Typesense bulk-indexing script
 * ================================
 * Connects to MongoDB, fetches all records, and upserts them into Typesense.
 * Run once after deploying or whenever you need a full re-index:
 *
 *   npm run ts:index
 *
 * The script is idempotent — safe to run multiple times.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const {
    ensureCollections, bulkImport,
    petToDoc, productToDoc, serviceToDoc, eventToDoc, mateToDoc
} = require('../utils/typesense');

const Pet     = require('../models/pets');
const Product = require('../models/products');
const User    = require('../models/users');
const Event   = require('../models/event');
const PetMate = require('../models/petMate');

const BATCH = 500; // documents per import batch

async function importCollection(label, Model, filter, toDoc) {
    let skip = 0, total = 0;
    console.log(`\n[${label}] Starting import…`);
    while (true) {
        const docs = await Model.find(filter).skip(skip).limit(BATCH).lean();
        if (!docs.length) break;
        await bulkImport(label, docs.map(toDoc));
        total += docs.length;
        skip  += docs.length;
        process.stdout.write(`  ${total} docs indexed\r`);
    }
    console.log(`[${label}] Done — ${total} documents`);
}

async function run() {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');

    // Ensure Typesense collections exist
    await ensureCollections();
    console.log('Typesense collections ready\n');

    await importCollection('pets',     Pet,     { available: true },                         petToDoc);
    await importCollection('products', Product, { isActive:  true },                         productToDoc);
    await importCollection('services', User,    { role: 'service_provider', isApproved: true }, serviceToDoc);
    await importCollection('events',   Event,   { status: 'upcoming', eventDate: { $gte: new Date() } }, eventToDoc);
    await importCollection('mates',    PetMate, {},                                           mateToDoc);

    console.log('\nAll collections indexed successfully.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('Indexing failed:', err);
    process.exit(1);
});
