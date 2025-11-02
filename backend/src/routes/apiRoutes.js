const express = require('express');
const router = express.Router();

const Pet = require('../models/pets');
const Product = require('../models/products');
const Service = require('../models/serviceProvider');

router.get('/featured-pets', async (req, res) => {
    try {
        const pets = await Pet.find().sort({ createdAt: -1 }).limit(4);
        res.json(pets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching featured pets' });
    }
});

router.get('/featured-products', async (req, res) => {
    try {
        const products = await Product.find().sort({ avgRating: -1 }).limit(4);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching featured products' });
    }
});

router.get('/check-session', (req, res) => {
    if (req.session && req.session.userId && req.user) { 
        res.json({
            success: true,
            isLoggedIn: true,
            user: {
                _id: req.user._id,
                username: req.user.username,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role,
                phoneNo: req.user.phoneNo,
                address: req.user.address,
                profilePicture: req.user.profilePicture
            }
        });
    } else {
        res.json({ 
            success: false,
            isLoggedIn: false 
        });
    }
});

// Pets API endpoints
router.get('/pets', async (req, res) => {
    try {
        const pets = await Pet.find({ available: true });
        res.json({ success: true, data: pets });
    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).json({ success: false, message: 'Error fetching pets' });
    }
});

router.get('/pets/:id', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        res.json({ success: true, data: pet });
    } catch (err) {
        console.error('Error fetching pet:', err);
        res.status(500).json({ success: false, message: 'Error fetching pet' });
    }
});

// Products API endpoints
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        console.log('Found products:', products.length);
        res.json({ success: true, data: products });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
});

// Services API endpoints
router.get('/services', async (req, res) => {
    try {
        const services = await Service.find({ available: true });
        res.json({ success: true, data: services });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ success: false, message: 'Error fetching services' });
    }
});

// Search API endpoint
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json({ success: true, pets: [], products: [], services: [] });
        }

        const searchRegex = new RegExp(query, 'i');
        
        const [pets, products, services] = await Promise.all([
            Pet.find({
                available: true,
                $or: [
                    { breed: searchRegex },
                    { description: searchRegex },
                    { category: searchRegex }
                ]
            }).limit(5),
            Product.find({
                available: true,
                $or: [
                    { name: searchRegex },
                    { brand: searchRegex },
                    { description: searchRegex }
                ]
            }).limit(5),
            Service.find({
                available: true,
                $or: [
                    { serviceType: searchRegex },
                    { description: searchRegex }
                ]
            }).limit(5)
        ]);

        res.json({ success: true, pets, products, services });
    } catch (err) {
        console.error('Error searching:', err);
        res.status(500).json({ success: false, message: 'Error performing search' });
    }
});

// Pet image endpoint
router.get('/pets/:id/image/:imageIndex?', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet || !pet.images || pet.images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        const imageIndex = parseInt(req.params.imageIndex) || 0;
        if (imageIndex >= pet.images.length) {
            return res.status(404).json({ success: false, message: 'Image index out of range' });
        }

        const image = pet.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.send(Buffer.from(image.data, 'base64'));
    } catch (err) {
        console.error('Error serving pet image:', err);
        res.status(500).json({ success: false, message: 'Error serving image' });
    }
});

// Product image endpoint
router.get('/products/:id/image/:imageIndex?', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.images || product.images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        const imageIndex = parseInt(req.params.imageIndex) || 0;
        if (imageIndex >= product.images.length) {
            return res.status(404).json({ success: false, message: 'Image index out of range' });
        }

        const image = product.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.send(Buffer.from(image.data, 'base64'));
    } catch (err) {
        console.error('Error serving product image:', err);
        res.status(500).json({ success: false, message: 'Error serving image' });
    }
});

module.exports = router;