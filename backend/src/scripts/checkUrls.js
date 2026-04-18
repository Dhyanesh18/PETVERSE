require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    
    const Product = require('../models/products');
    const Pet = require('../models/pets');
    const PetMate = require('../models/petMate');
    
    const products = await Product.find({}).select('name images').lean();
    let pWithUrl = 0;
    products.forEach(p => {
        const hasUrl = p.images?.some(img => img.url);
        if (hasUrl) pWithUrl++;
        console.log('PRODUCT:', p.name, '| url:', p.images?.[0]?.url || 'NONE');
    });
    console.log(`Products with URL: ${pWithUrl}/${products.length}\n`);
    
    const pets = await Pet.find({}).select('name breed images').lean();
    let petWithUrl = 0;
    pets.forEach(p => {
        const hasUrl = p.images?.some(img => img.url);
        if (hasUrl) petWithUrl++;
        console.log('PET:', p.name, p.breed, '| url:', p.images?.[0]?.url || 'NONE');
    });
    console.log(`Pets with URL: ${petWithUrl}/${pets.length}\n`);
    
    const mates = await PetMate.find({}).select('petName images').lean();
    let mWithUrl = 0;
    mates.forEach(m => {
        const hasUrl = m.images?.some(img => img.url);
        if (hasUrl) mWithUrl++;
        console.log('MATE:', m.petName, '| url:', m.images?.[0]?.url || 'NONE');
    });
    console.log(`Mates with URL: ${mWithUrl}/${mates.length}`);
    
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
