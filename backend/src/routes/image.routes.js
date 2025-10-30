const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const Pet = require('../models/pets');
const Event = require('../models/event');
const User = require('../models/users');

// Get product image by index
router.get('/product/:productId/:index', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const index = parseInt(req.params.index);
        if (!product.images || !product.images[index]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found at specified index'
            });
        }
        
        const image = product.images[index];
        
        // Set appropriate headers for image serving
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(image.data);
    } catch (err) {
        console.error('Error serving product image:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading image',
            message: err.message
        });
    }
});

// Get all product images metadata (URLs only, not binary data)
router.get('/product/:productId/metadata', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId).select('images');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const imageMetadata = product.images.map((img, index) => ({
            index,
            url: `/images/product/${req.params.productId}/${index}`,
            contentType: img.contentType,
            size: img.data ? img.data.length : 0
        }));

        res.json({
            success: true,
            data: {
                productId: product._id,
                images: imageMetadata,
                count: imageMetadata.length
            }
        });
    } catch (err) {
        console.error('Error fetching product image metadata:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading image metadata',
            message: err.message
        });
    }
});

// Get pet image by index
router.get('/pet/:petId/:index', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.petId);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        const index = parseInt(req.params.index);
        if (!pet.images || !pet.images[index]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found at specified index'
            });
        }
        
        const image = pet.images[index];
        
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (err) {
        console.error('Error serving pet image:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading image',
            message: err.message
        });
    }
});

// Get event image/banner
router.get('/event/:eventId/:index?', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const index = req.params.index ? parseInt(req.params.index) : 0;
        if (!event.images || !event.images[index]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }
        
        const image = event.images[index];
        
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (err) {
        console.error('Error serving event image:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading image',
            message: err.message
        });
    }
});

// Get user profile picture
router.get('/user/:userId/profile', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('profilePicture');
        
        if (!user || !user.profilePicture || !user.profilePicture.data) {
            return res.status(404).json({
                success: false,
                error: 'Profile picture not found'
            });
        }
        
        res.set('Content-Type', user.profilePicture.contentType);
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(user.profilePicture.data);
    } catch (err) {
        console.error('Error serving profile picture:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading profile picture',
            message: err.message
        });
    }
});

// Get seller license document
router.get('/document/license/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('license role');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.role !== 'seller' || !user.license || !user.license.data) {
            return res.status(404).json({
                success: false,
                error: 'License document not found'
            });
        }
        
        res.set('Content-Type', user.license.contentType);
        res.set('Content-Disposition', 'inline');
        res.send(user.license.data);
    } catch (err) {
        console.error('Error serving license document:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading license document',
            message: err.message
        });
    }
});

// Get service provider certificate
router.get('/document/certificate/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('certificate role');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.role !== 'service_provider' || !user.certificate || !user.certificate.data) {
            return res.status(404).json({
                success: false,
                error: 'Certificate not found'
            });
        }
        
        res.set('Content-Type', user.certificate.contentType);
        res.set('Content-Disposition', 'inline');
        res.send(user.certificate.data);
    } catch (err) {
        console.error('Error serving certificate:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading certificate',
            message: err.message
        });
    }
});

// Get event permission document
router.get('/document/permission/:eventId', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId).select('permissionDocument');
        
        if (!event || !event.permissionDocument || !event.permissionDocument.data) {
            return res.status(404).json({
                success: false,
                error: 'Permission document not found'
            });
        }
        
        res.set('Content-Type', event.permissionDocument.contentType);
        res.set('Content-Disposition', 'inline');
        res.send(event.permissionDocument.data);
    } catch (err) {
        console.error('Error serving permission document:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading permission document',
            message: err.message
        });
    }
});

// Health check endpoint for image service
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Image service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;