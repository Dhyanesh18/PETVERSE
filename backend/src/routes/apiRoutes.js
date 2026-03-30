const express = require('express');
const router = express.Router();

const Pet = require('../models/pets');
const Product = require('../models/products');
const Service = require('../models/serviceProvider');

/**
 * @swagger
 * /api/featured-pets:
 *   get:
 *     tags: [General]
 *     summary: Get up to 4 most recent available pets
 *     responses:
 *       200:
 *         description: Array of featured pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/featured-pets', async (req, res) => {
    try {
        const pets = await Pet.find({ available: true })
            .sort({ createdAt: -1 })
            .limit(4)
            .select({ 'images.data': 0 })
            .lean();

        const safePets = (pets || []).map((pet) => ({
            ...pet,
            thumbnail: pet.images && pet.images.length > 0 ? `/api/pets/image/${pet._id}/0` : null
        }));

        res.set('Cache-Control', 'no-store');
        res.json(safePets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching featured pets' });
    }
});

/**
 * @swagger
 * /api/featured-products:
 *   get:
 *     tags: [General]
 *     summary: Get up to 4 highest-rated available products
 *     responses:
 *       200:
 *         description: Array of featured products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/featured-products', async (req, res) => {
    try {
        const products = await Product.find({ available: true })
            .sort({ avgRating: -1 })
            .limit(4)
            .select({ 'images.data': 0 })
            .lean();

        const safeProducts = (products || []).map((product) => ({
            ...product,
            thumbnail: product.images && product.images.length > 0 ? `/api/products/image/${product._id}/0` : null
        }));

        res.set('Cache-Control', 'no-store');
        res.json(safeProducts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching featured products' });
    }
});

/**
 * @swagger
 * /api/check-session:
 *   get:
 *     tags: [General]
 *     summary: Check if the current user session is active
 *     responses:
 *       200:
 *         description: Session status with user info if logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isLoggedIn:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   nullable: true
 */
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

/**
 * @swagger
 * /api/pets:
 *   get:
 *     tags: [General]
 *     summary: Get all available pets (no raw image data)
 *     responses:
 *       200:
 *         description: List of pets
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/pets', async (req, res) => {
    try {
        const pets = await Pet.find({ available: true })
            .select({ 'images.data': 0 })
            .lean();

        const safePets = (pets || []).map((pet) => ({
            ...pet,
            thumbnail: pet.images && pet.images.length > 0 ? `/api/pets/image/${pet._id}/0` : null
        }));

        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: safePets });
    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).json({ success: false, message: 'Error fetching pets' });
    }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   get:
 *     tags: [General]
 *     summary: Get a single pet by ObjectId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pet ObjectId (24-char hex)
 *     responses:
 *       200:
 *         description: Pet details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Pet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/pets/:id([0-9a-fA-F]{24})', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id)
            .select({ 'images.data': 0 })
            .lean();
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        res.set('Cache-Control', 'no-store');
        res.json({
            success: true,
            data: {
                ...pet,
                thumbnail: pet.images && pet.images.length > 0 ? `/api/pets/image/${pet._id}/0` : null
            }
        });
    } catch (err) {
        console.error('Error fetching pet:', err);
        res.status(500).json({ success: false, message: 'Error fetching pet' });
    }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [General]
 *     summary: Get all available products (no raw image data)
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ available: true })
            .select({ 'images.data': 0 })
            .lean();

        const safeProducts = (products || []).map((product) => ({
            ...product,
            thumbnail: product.images && product.images.length > 0 ? `/api/products/image/${product._id}/0` : null
        }));

        console.log('Found products:', safeProducts.length);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: safeProducts });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [General]
 *     summary: Get a single product by ObjectId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ObjectId (24-char hex)
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/products/:id([0-9a-fA-F]{24})', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .select({ 'images.data': 0 })
            .lean();
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.set('Cache-Control', 'no-store');
        res.json({ 
            success: true, 
            data: { 
                product: product 
            } 
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
});

// Services API endpoints - REMOVED: Conflicts with /api/services route in service.routes.js

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [General]
 *     summary: Search across pets, products, and services
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pets:
 *                   type: array
 *                   items:
 *                     type: object
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 */
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
            })
                .limit(5)
                .select({ 'images.data': 0 })
                .lean(),
            Product.find({
                available: true,
                $or: [
                    { name: searchRegex },
                    { brand: searchRegex },
                    { description: searchRegex }
                ]
            })
                .limit(5)
                .select({ 'images.data': 0 })
                .lean(),
            Service.find({
                $or: [
                    { serviceType: searchRegex },
                    { description: searchRegex }
                ]
            })
                .limit(5)
                .select({ 'certificate.data': 0 })
                .lean()
        ]);

        const safePets = (pets || []).map((pet) => ({
            ...pet,
            thumbnail: pet.images && pet.images.length > 0 ? `/api/pets/image/${pet._id}/0` : null
        }));

        const safeProducts = (products || []).map((product) => ({
            ...product,
            thumbnail: product.images && product.images.length > 0 ? `/api/products/image/${product._id}/0` : null
        }));

        res.set('Cache-Control', 'no-store');
        res.json({ success: true, pets: safePets, products: safeProducts, services });
    } catch (err) {
        console.error('Error searching:', err);
        res.status(500).json({ success: false, message: 'Error performing search' });
    }
});

/**
 * @swagger
 * /api/pets/{id}/image/{imageIndex}:
 *   get:
 *     tags: [General]
 *     summary: Serve a pet image binary by pet ID and index
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageIndex
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/pets/:id([0-9a-fA-F]{24})/image/:imageIndex?', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet || !pet.images || pet.images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        const rawIndex = req.params.imageIndex;
        const imageIndex = rawIndex === undefined ? 0 : parseInt(rawIndex, 10);
        if (Number.isNaN(imageIndex) || imageIndex < 0) {
            return res.status(400).json({ success: false, message: 'Invalid image index' });
        }
        if (imageIndex >= pet.images.length) {
            return res.status(404).json({ success: false, message: 'Image index out of range' });
        }

        const image = pet.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (err) {
        console.error('Error serving pet image:', err);
        res.status(500).json({ success: false, message: 'Error serving image' });
    }
});

/**
 * @swagger
 * /api/products/{id}/image/{imageIndex}:
 *   get:
 *     tags: [General]
 *     summary: Serve a product image binary by product ID and index
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageIndex
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/products/:id([0-9a-fA-F]{24})/image/:imageIndex?', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.images || product.images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        const rawIndex = req.params.imageIndex;
        const imageIndex = rawIndex === undefined ? 0 : parseInt(rawIndex, 10);
        if (Number.isNaN(imageIndex) || imageIndex < 0) {
            return res.status(400).json({ success: false, message: 'Invalid image index' });
        }
        if (imageIndex >= product.images.length) {
            return res.status(404).json({ success: false, message: 'Image index out of range' });
        }

        const image = product.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (err) {
        console.error('Error serving product image:', err);
        res.status(500).json({ success: false, message: 'Error serving image' });
    }
});

module.exports = router;