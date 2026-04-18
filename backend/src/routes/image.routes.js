const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const Pet = require('../models/pets');
const Event = require('../models/event');
const User = require('../models/users');

// CORS middleware for all image routes
router.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

/**
 * @swagger
 * /images/product/{productId}/{index}:
 *   get:
 *     tags: [Images]
 *     summary: Serve a product image by product ID and zero-based index
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ObjectId
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Zero-based image index
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Product or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get product image by index
router.get('/product/:productId/:index', async (req, res) => {
    try {
        console.log(`Image request: product ${req.params.productId}, index ${req.params.index}`);
        const product = await Product.findById(req.params.productId);
        
        if (!product) {
            console.log(`Product not found: ${req.params.productId}`);
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const index = parseInt(req.params.index);
        console.log(`Product has ${product.images?.length || 0} images`);
        
        if (!product.images || !product.images[index]) {
            console.log(`Image not found at index ${index}`);
            return res.status(404).json({
                success: false,
                error: 'Image not found at specified index'
            });
        }
        
        const image = product.images[index];
        
        // Redirect to Cloudinary URL if available
        if (image.url) {
            return res.redirect(image.url);
        }
        
        if (!image.data) {
            return res.redirect('/images/default-product.jpg');
        }
        
        // Set appropriate headers for image serving
        res.set('Content-Type', image.contentType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
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

/**
 * @swagger
 * /images/product/{productId}/metadata:
 *   get:
 *     tags: [Images]
 *     summary: Get image metadata (URL list, content-types, sizes) for a product without binary data
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ObjectId
 *     responses:
 *       200:
 *         description: Image metadata list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     count:
 *                       type: integer
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           index:
 *                             type: integer
 *                           url:
 *                             type: string
 *                           contentType:
 *                             type: string
 *                           size:
 *                             type: integer
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /images/pet/{petId}/{index}:
 *   get:
 *     tags: [Images]
 *     summary: Serve a pet image by pet ID and zero-based index
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema:
 *           type: string
 *         description: Pet ObjectId
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Zero-based image index
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Pet or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get pet image by index
router.get('/pet/:petId/:index', async (req, res) => {
    try {
        console.log(`Pet image request: pet ${req.params.petId}, index ${req.params.index}`);
        const pet = await Pet.findById(req.params.petId);
        
        if (!pet) {
            console.log(`Pet not found: ${req.params.petId}`);
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        const index = parseInt(req.params.index);
        console.log(`Pet has ${pet.images?.length || 0} images`);
        
        if (!pet.images || !pet.images[index]) {
            console.log(`Pet image not found at index ${index}`);
            return res.status(404).json({
                success: false,
                error: 'Image not found at specified index'
            });
        }
        
        const image = pet.images[index];
        
        // Redirect to Cloudinary URL if available
        if (image.url) {
            return res.redirect(image.url);
        }
        
        if (!image.data) {
            return res.redirect('/images/default-pet.jpg');
        }
        
        res.set('Content-Type', image.contentType || 'image/jpeg');
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

/**
 * @swagger
 * /images/event/{eventId}/{index}:
 *   get:
 *     tags: [Images]
 *     summary: Serve an event banner/image by event ID and optional index
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *       - in: path
 *         name: index
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Zero-based image index (defaults to 0)
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Event or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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
        
        // Redirect to Cloudinary URL if available
        if (image.url) {
            return res.redirect(image.url);
        }
        
        if (!image.data) {
            return res.redirect('/images/dog-event.png');
        }
        
        res.set('Content-Type', image.contentType || 'image/jpeg');
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

/**
 * @swagger
 * /images/user/{userId}/profile:
 *   get:
 *     tags: [Images]
 *     summary: Serve a user's profile picture
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: Raw profile picture binary (cached 1 hour)
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: User or profile picture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get user profile picture
router.get('/user/:userId/profile', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('profilePicture');
        
        if (!user || !user.profilePicture) {
            return res.status(404).json({
                success: false,
                error: 'Profile picture not found'
            });
        }
        
        // Redirect to Cloudinary URL if available
        if (user.profilePicture.url) {
            return res.redirect(user.profilePicture.url);
        }
        
        if (!user.profilePicture.data) {
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

/**
 * @swagger
 * /images/document/license/{userId}:
 *   get:
 *     tags: [Images]
 *     summary: Serve a seller's business license document (PDF or image)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller's User ObjectId
 *     responses:
 *       200:
 *         description: Raw license document binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: User not found or license not uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        if (user.role !== 'seller' || !user.license) {
            return res.status(404).json({
                success: false,
                error: 'License document not found'
            });
        }
        
        // Redirect to Cloudinary URL if available
        if (user.license.url) {
            return res.redirect(user.license.url);
        }
        
        if (!user.license.data) {
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

/**
 * @swagger
 * /images/document/certificate/{userId}:
 *   get:
 *     tags: [Images]
 *     summary: Serve a service provider's professional certificate (PDF or image)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service provider's User ObjectId
 *     responses:
 *       200:
 *         description: Raw certificate binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: User not found or certificate not uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        if (user.role !== 'service_provider' || !user.certificate) {
            return res.status(404).json({
                success: false,
                error: 'Certificate not found'
            });
        }
        
        // Redirect to Cloudinary URL if available
        if (user.certificate.url) {
            return res.redirect(user.certificate.url);
        }
        
        if (!user.certificate.data) {
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

/**
 * @swagger
 * /images/document/permission/{eventId}:
 *   get:
 *     tags: [Images]
 *     summary: Serve a government permission document for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *     responses:
 *       200:
 *         description: Raw permission document binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Event not found or permission document missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get event permission document
router.get('/document/permission/:eventId', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId).select('permissionDocument');
        
        if (!event || !event.permissionDocument) {
            return res.status(404).json({
                success: false,
                error: 'Permission document not found'
            });
        }
        
        // Redirect to Cloudinary URL if available
        if (event.permissionDocument.url) {
            return res.redirect(event.permissionDocument.url);
        }
        
        if (!event.permissionDocument.data) {
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

/**
 * @swagger
 * /images/health:
 *   get:
 *     tags: [Images]
 *     summary: Health check for the image service
 *     responses:
 *       200:
 *         description: Image service is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check endpoint for image service
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Image service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;