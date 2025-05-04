const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/products');

const sampleProducts = [
    {
        name: "Premium Dog Food",
        title: "Royal Canin Premium Adult Dog Food - 5kg Pack",
        description: "High-quality nutrition for your dog",
        price: 999.99,
        mrp: 1199.99,
        category: "Pet Food",
        brand: "Royal Canin",
        stock: 100,
        image_url: "dog-food.jpg",
        image1: "Drools.jpg",
        image2: "dog-food-2.jpg",
        image3: "dog-food-3.jpg",
        rating: 4.5,
        reviewCount: 25,
        tags: ["dog food", "premium", "dry food"],
        discount: 10,
        specifications: {
            weight: "5kg",
            type: "Dry Food",
            ageRange: "Adult",
            specialFeatures: ["Grain Free", "High Protein"]
        }
    },
    {
        name: "Interactive Cat Toy",
        title: "PetPlay Interactive LED Motion Cat Toy",
        description: "Engaging toy for cats",
        price: 299.99,
        mrp: 349.99,
        category: "Toys",
        brand: "PetPlay",
        stock: 50,
        image_url: "cat-toy.jpg",
        image1: "cat-toy-1.jpg",
        image2: "cat-toy-2.jpg",
        image3: "cat-toy-3.jpg",
        rating: 4.8,
        reviewCount: 15,
        tags: ["cat toy", "interactive", "entertainment"],
        discount: 5,
        specifications: {
            material: "Non-toxic plastic",
            size: "Medium",
            batteryRequired: true,
            color: "Multi-colored"
        }
    },
    {
        name: "Adjustable Dog Collar",
        title: "PawPerfect Premium Adjustable Nylon Dog Collar",
        description: "Comfortable and durable collar",
        price: 199.99,
        mrp: 249.99,
        category: "Accessories",
        brand: "PawPerfect",
        stock: 75,
        image_url: "dog-collar.jpg",
        image1: "dog-collar-1.jpg",
        image2: "dog-collar-2.jpg",
        image3: "dog-collar-3.jpg",
        rating: 4.3,
        reviewCount: 30,
        tags: ["dog collar", "adjustable", "durable"],
        discount: 0,
        specifications: {
            material: "Nylon",
            size: "Medium",
            adjustableRange: "25-40cm",
            color: "Blue"
        }
    }
];

// Function to add sample products to the database
async function addSampleProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Clear existing products
        await Product.deleteMany({});
        // Insert new sample products
        const result = await Product.insertMany(sampleProducts);
        console.log(`Successfully added ${result.length} sample products`);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error adding sample products:', error);
    }
}

// Add this script to update all products missing image_url
async function setDefaultImageForProducts() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await Product.updateMany(
        { $or: [ { image_url: { $exists: false } }, { image_url: '' } ] },
        { $set: { image_url: 'default.jpg' } }
    );
    console.log(`Updated ${result.nModified || result.modifiedCount} products with default image.`);
    await mongoose.disconnect();
}

if (require.main === module) {
    addSampleProducts().catch(err => {
        console.error('Error adding sample products:', err);
        process.exit(1);
    });
    // Optionally, you can still call the other update functions if needed:
    // setDefaultImageForProducts().catch(...)
    // setDefaultGalleryImages().catch(...)
}

module.exports = addSampleProducts; 