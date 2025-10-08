const express = require("express");
const router = express.Router();

const Pet = require('../models/pets');
const Product = require('../models/products');
const ServiceProvider = require('../models/serviceProvider');

router.get('/api', async (req, res) => {
    const query = req.query.term;
    if (!query || query.trim() === '') {
        return res.json({ pets: [], products: [], services: [] });
    }

    try {
        const regex = new RegExp(query, 'i');

        const [pets, products, services] = await Promise.all([
        Pet.find({ $or: [{ name: regex }, { breed: regex }, { category: regex }] }).limit(5),
        Product.find({ $or: [{ name: regex }, { brand: regex }, { category: regex }] }).limit(5),
        ServiceProvider.find({
            $or: [{ serviceType: regex }, { serviceAddress: regex }]
        }).limit(5)
        ]);

        res.json({ pets, products, services });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    const query = req.query.q;
    if (!query || query.trim() === '') {
        return res.render('searchResults', { 
        query: '', 
        pets: [], 
        products: [], 
        services: [] 
        });
    }

    try {
        const regex = new RegExp(query, 'i'); 

        const [pets, products, services] = await Promise.all([
        Pet.find({ $or: [{ name: regex }, { breed: regex }, { category: regex }] }).limit(10),
        Product.find({ $or: [{ name: regex }, { brand: regex }, { category: regex }] }).limit(10),
        ServiceProvider.find({ 
            $or: [
            { serviceType: regex }, 
            { serviceAddress: regex }
            ] 
        }).limit(10)
        ]);

        res.render('searchResults', {
        query,
        pets,
        products,
        services
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;