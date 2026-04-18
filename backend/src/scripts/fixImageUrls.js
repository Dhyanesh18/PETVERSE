/**
 * Fix missing image URLs: reads disk images, uploads to Cloudinary, patches MongoDB.
 * Run: node backend/src/scripts/fixImageUrls.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary } = require('../utils/cloudinary');

const IMAGES_ROOT = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'images');

// --- Mappings: _id -> array of disk filenames relative to IMAGES_ROOT ---
const PRODUCT_MAP = {
    '681a63f411befa8b83f8124b': ['products/Drools.jpg', 'products/drools1.jpg', 'products/drools2.jpg'],   // Drools Adult Chicken and Egg (3 imgs)
    '681b1a39a58f8f29eeaa0fa3': ['products/kong_toy.jpg'],          // Kong toy for dogs
    '681b1ad1a58f8f29eeaa0fbf': ['products/litterbox.jpg'],         // Litter box
    '681d9f273f0158603a92ce7b': ['products/spring.jpg'],            // Spring Toy
    '681d9fcf3f0158603a92ce8f': ['products/hidesquirrel.jpg'],      // Hide Squirrel puzzle
    '68eb985d9e376125d2ee761f': ['products/car_seat_cover.jpg'],    // Car seat cover
    '68eb994a9e376125d2ee76ac': ['products/food4.jpg'],             // Taiyo Fish food
    '68eb99c39e376125d2ee7712': ['products/bowl.jpg'],              // Cat and Dog Feeding Bowl
    // '693054819bfd9d8861e0a871' - Scented Soy Wax Candle: no matching image, skip
};

const PET_MAP = {
    '681a6bb0d5682644fcf7f61e': ['pets/rott.jpg'],       // Rottweiler Vetri
    '681ca2985a54c9b439529a03': ['pets/german.jpg'],     // German Shepherd Tony
    '681da73a3f0158603a92cfd9': ['pets/persian.jpg'],    // Persian Zoda
    '681da78a3f0158603a92cfe5': ['pets/betta.jpg'],      // Betta Nemo
    '681da7ec3f0158603a92cff3': ['pets/bengal.jpg'],     // Bengal Leo
    '681da93fccb93e0fcecacee4': ['pets/rabbit.jpg'],     // Rabbit hippy
    '681e6a8bae3d0b27ca8fe7d1': ['pets/cockatiel.jpg'],  // Cockatiel Robin
    '68eb907c80438205eecd80a3': ['pets/beagle.jpg'],     // Beagle Max
    '68eb93c780438205eecd81bd': ['pets/siamese.jpg'],    // Siamese Bella
    '68eb94ab80438205eecd8205': ['pets/parrot.jpg'],     // African Grey Parrot Charlie
    '68eb97ac9e376125d2ee75d7': ['pets/betta.jpg'],      // Fish Nemo (use betta)
    '68ecc51b067a066f6d8c7ebc': ['pets/gsdpup.jpg'],    // German Shepherd johny
};

const MATE_MAP = {
    '681a912ca30661270e906a67': ['pets/german.jpg'],     // German Shepherd mate
    '68eabb856715b8a84c3dc5ec': ['pets/siberian.jpg'],   // Siberian Husky mate
};

async function uploadFile(filePath, folder) {
    const buffer = fs.readFileSync(filePath);
    const result = await uploadToCloudinary(buffer, { folder: `petverse/${folder}` });
    return result.url;
}

async function fixCollection(Model, modelName, idMap, folder) {
    console.log(`\n=== Fixing ${modelName} ===`);
    let fixed = 0, skipped = 0, failed = 0;

    for (const [id, filenames] of Object.entries(idMap)) {
        const doc = await Model.findById(id).lean();
        if (!doc) {
            console.log(`  SKIP ${id}: not found in DB`);
            skipped++;
            continue;
        }

        const images = doc.images || [];
        const newImages = [...images];
        let updated = false;

        for (let i = 0; i < filenames.length; i++) {
            // Only update images that don't have a URL yet
            if (newImages[i] && newImages[i].url) {
                console.log(`  SKIP ${modelName} ${id} img[${i}]: already has URL`);
                skipped++;
                continue;
            }

            const diskPath = path.join(IMAGES_ROOT, filenames[i]);
            if (!fs.existsSync(diskPath)) {
                console.log(`  SKIP ${id} img[${i}]: file not found: ${diskPath}`);
                skipped++;
                continue;
            }

            try {
                console.log(`  Uploading ${filenames[i]} for ${modelName} ${id} img[${i}]...`);
                const url = await uploadFile(diskPath, folder);
                if (newImages[i]) {
                    newImages[i] = { ...newImages[i], url };
                } else {
                    newImages[i] = { url, contentType: 'image/jpeg' };
                }
                updated = true;
                fixed++;
                console.log(`    -> ${url}`);
            } catch (err) {
                console.error(`  FAIL ${id} img[${i}]: ${err.message}`);
                failed++;
            }
        }

        if (updated) {
            await Model.updateOne({ _id: id }, { $set: { images: newImages } });
            console.log(`  SAVED ${modelName} ${id}`);
        }
    }

    console.log(`${modelName}: ${fixed} fixed, ${skipped} skipped, ${failed} failed`);
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Product = require('../models/products');
    const Pet = require('../models/pets');
    const PetMate = require('../models/petMate');

    await fixCollection(Product, 'Product', PRODUCT_MAP, 'products');
    await fixCollection(Pet, 'Pet', PET_MAP, 'pets');
    await fixCollection(PetMate, 'PetMate', MATE_MAP, 'mates');

    console.log('\nDone! Run checkUrls.js to verify.');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
