const express = require('express');
const router = express.Router();

const Pet = require('../models/Pet');
const Product = require('../models/Product');


router.get('/featured-pets', async (req, res) => {
    try {
        const pets = await Pet.find().sort({ createdAt: -1 }).limit(4);
        res.json(pets);
    } catch (err) {
        console.error(err); // Good practice to log the error
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
    if (req.session && req.session.user) { // Added a check for req.session itself
        res.json({
            isLoggedIn: true,
            isAdmin: req.session.user.role === 'admin'
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Don't forget to export the router
module.exports = router;