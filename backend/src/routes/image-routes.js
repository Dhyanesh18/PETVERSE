const express = require('express');
const router = express.Router();
const Product = require('../models/products');


router.get('/product/image/:productId/:index', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        
        if (!product || !product.images[req.params.index]) {
            return res.status(404).send('Image not found');
        }
        
        const image = product.images[req.params.index];
        res.set('Content-Type', image.contentType);
        res.send(image.data);
    } catch (err) {
        console.error('Error serving image:', err);
        res.status(500).send('Error loading image');
    }
});

module.exports = router;