/**
 * Migration script: Upload existing binary images from MongoDB to Cloudinary
 * Run: node backend/src/scripts/migrateToCloudinary.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrateCollection(Model, modelName, imageFields, folder) {
  const docs = await Model.find({}).lean();
  let migrated = 0, skipped = 0, failed = 0;

  for (const doc of docs) {
    for (const field of imageFields) {
      const images = Array.isArray(doc[field]) ? doc[field] : doc[field] ? [doc[field]] : [];
      const isArray = Array.isArray(doc[field]);
      let updated = false;
      const newImages = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.url) { skipped++; newImages.push(img); continue; }
        if (!img.data) { newImages.push(img); continue; }

        try {
          const buffer = Buffer.isBuffer(img.data) ? img.data : img.data.buffer || img.data;
          const result = await uploadToCloudinary(buffer, { folder: `petverse/${folder}` });
          newImages.push({ ...img, url: result.secure_url, publicId: result.public_id, data: undefined, contentType: img.contentType });
          updated = true;
          migrated++;
        } catch (err) {
          console.error(`  Failed ${modelName} ${doc._id} image ${i}: ${err.message}`);
          newImages.push(img);
          failed++;
        }
      }

      if (updated) {
        const updateVal = isArray ? newImages : newImages[0];
        await Model.updateOne({ _id: doc._id }, { $set: { [field]: updateVal } });
      }
    }
  }

  console.log(`${modelName}: ${migrated} migrated, ${skipped} skipped (already on Cloudinary), ${failed} failed`);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const Pet = require('../models/pets');
  const Product = require('../models/products');
  const PetMate = require('../models/petMate');
  const LostPet = require('../models/lostPet');
  const Event = require('../models/event');
  const User = require('../models/users');

  await migrateCollection(Pet, 'Pet', ['images'], 'pets');
  await migrateCollection(Product, 'Product', ['images'], 'products');
  await migrateCollection(PetMate, 'PetMate', ['images'], 'mates');
  await migrateCollection(LostPet, 'LostPet', ['images'], 'lost-pets');
  await migrateCollection(Event, 'Event', ['permissionDocument'], 'events');

  // Seller licenses & service provider certificates (discriminator fields)
  const sellers = await User.find({ role: 'seller', 'license.data': { $exists: true } });
  for (const seller of sellers) {
    if (seller.license?.url) continue;
    if (!seller.license?.data) continue;
    try {
      const buf = Buffer.isBuffer(seller.license.data) ? seller.license.data : seller.license.data.buffer;
      const result = await uploadToCloudinary(buf, { folder: 'petverse/licenses' });
      await User.updateOne({ _id: seller._id }, { $set: { 'license.url': result.secure_url, 'license.publicId': result.public_id } });
      console.log(`Migrated seller license: ${seller._id}`);
    } catch (e) { console.error(`Failed seller ${seller._id}: ${e.message}`); }
  }

  const providers = await User.find({ role: 'service_provider', 'certificate.data': { $exists: true } });
  for (const prov of providers) {
    if (prov.certificate?.url) continue;
    if (!prov.certificate?.data) continue;
    try {
      const buf = Buffer.isBuffer(prov.certificate.data) ? prov.certificate.data : prov.certificate.data.buffer;
      const result = await uploadToCloudinary(buf, { folder: 'petverse/certificates' });
      await User.updateOne({ _id: prov._id }, { $set: { 'certificate.url': result.secure_url, 'certificate.publicId': result.public_id } });
      console.log(`Migrated provider certificate: ${prov._id}`);
    } catch (e) { console.error(`Failed provider ${prov._id}: ${e.message}`); }
  }

  console.log('\nMigration complete!');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
