const express = require('express');
const router = express.Router();
const multer = require('multer');
const sellerAuth = require('../middleware/sellerAuth'); 
const Product = require('../models/products'); 
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024, 
        files: 5 
    }
});

// Add product page
router.get('/products/add', sellerAuth, (req, res) => {
    // if (!req.session.isApproved) {
    //     return res.render('error', { message: 'Your seller account is not yet approved' });
    // }
    res.render('add-product');
});

// Handle product submission
router.post('/products/add', sellerAuth, upload.array('images'), async (req, res) => {
    try {
        const productData = req.body;
        const images = req.files.map(file => ({
            data: file.buffer,
            contentType: file.mimetype
        }));

        const newProduct = new Product({
            ...productData,
            seller: req.user._id,
            images: images
        });

        await newProduct.save();
        res.status(200).json({success: true});
    } catch (err) {
        console.error('Product creation error:', err);
        res.status(400).json({
            success: false,
            message: 'Error creating product: '+err.message
        });
    }
});

router.get('/about', (req,res)=>{
    res.render('about', {
        activeUsers : 100,
        activeSellers : 15,
        activeServiceProviders: 10,
        petsAvailable: 250
    });
});

// Make sure to export the router
module.exports = router;