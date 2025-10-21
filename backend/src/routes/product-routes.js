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
const productController = require('../controllers/products');

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


router.get('/products/:category', async (req, res) => {
    try {
        const categoryMap = {
            'petfood': 'Pet Food',
            'toys': 'Toys',
            'accessories': 'Accessories'
        };

        const category = req.params.category;
        const categoryTitle = categoryMap[category] || 'Products';

        const products = await Product.find({ 
            category: categoryTitle,
            isActive: true 
        }).populate('seller', 'businessName');

        res.render('products', {
            categoryTitle: categoryTitle,
            category: categoryTitle,
            products: products
        });

    } catch (err) {
        res.status(500).render('error', { message: 'Error loading products' });
    }
});

router.get("/products/:id", productController.getProduct);

router.get('/about', (req,res)=>{
    res.render('about', {
        activeUsers : 100,
        activeSellers : 15,
        activeServiceProviders: 10,
        petsAvailable: 250
    });
});

// Product edit page
router.get('/products/:id/edit', sellerAuth, async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).render('error', { 
                message: 'Product not found or you do not have permission to edit it'
            });
        }

        res.render('edit-product', { product });
    } catch (err) {
        console.error('Error loading product for edit:', err);
        res.status(500).render('error', { message: 'Error loading product' });
    }
});

// Handle product update
router.post('/products/:id/edit', sellerAuth, upload.array('images'), async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or you do not have permission to edit it'
            });
        }

        // Update basic info
        const { name, description, price, discount, category, brand, stock } = req.body;
        
        product.name = name;
        product.description = description;
        product.price = price;
        product.discount = discount || 0;
        product.category = category;
        product.brand = brand;
        product.stock = stock;

        // Handle existing images (if any were marked for deletion)
        if (req.body.keepImages && Array.isArray(req.body.keepImages)) {
            const keepImages = req.body.keepImages;
            const updatedImages = [];
            
            product.images.forEach((image, index) => {
                if (keepImages[index] !== 'false') {
                    updatedImages.push(image);
                }
            });
            
            product.images = updatedImages;
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
            
            product.images = [...product.images, ...newImages];
        }

        await product.save();
        
        res.status(200).json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (err) {
        console.error('Product update error:', err);
        res.status(400).json({
            success: false,
            message: 'Error updating product: ' + err.message
        });
    }
});

// Product toggle active status
router.post('/products/:id/toggle', sellerAuth, async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or you do not have permission to edit it'
            });
        }

        // Toggle the active status
        product.isActive = !product.isActive;
        await product.save();

        res.status(200).json({
            success: true,
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (err) {
        console.error('Product toggle error:', err);
        res.status(400).json({
            success: false,
            message: 'Error toggling product status: ' + err.message
        });
    }
});

// Make sure to export the router
module.exports = router;