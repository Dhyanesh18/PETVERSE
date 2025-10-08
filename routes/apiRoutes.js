const express = require('express');
const router = express.Router();

const Pet = require('../models/pets');
const Product = require('../models/products');


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
    if (req.session && req.session.user) { 
        res.json({
            isLoggedIn: true,
            isAdmin: req.session.user.role === 'admin'
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

module.exports = router;