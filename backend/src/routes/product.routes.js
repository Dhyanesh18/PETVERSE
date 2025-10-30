const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/products');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Max 5 images
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.user) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirectPath: '/login'
    });
}

// Middleware to check if user is a seller
function isSeller(req, res, next) {
    if (req.user && req.user.role === 'seller') {
        return next();
    }
    res.status(403).json({
        success: false,
        error: 'Access denied. Sellers only.'
    });
}

// Get all products with optional filters (API endpoint)
router.get('/', async (req, res) => {
    try {
        const { 
            category, 
            minPrice, 
            maxPrice, 
            brand, 
            search,
            sortBy,
            page = 1, 
            limit = 12 
        } = req.query;
        
        let query = { isActive: true }; // Only show active products by default
        
        // Filter by category
        if (category) {
            const categoryMap = {
                'petfood': 'Pet Food',
                'toys': 'Toys',
                'accessories': 'Accessories'
            };
            query.category = categoryMap[category.toLowerCase()] || category;
        }
        
        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        
        // Filter by brand
        if (brand) {
            query.brand = new RegExp(brand, 'i');
        }
        
        // Search in name and description
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }
        
        console.log('Product filter query:', JSON.stringify(query));
        
        // Build sort option
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sortBy === 'price-asc') sortOption = { price: 1 };
        if (sortBy === 'price-desc') sortOption = { price: -1 };
        if (sortBy === 'name-asc') sortOption = { name: 1 };
        if (sortBy === 'name-desc') sortOption = { name: -1 };
        if (sortBy === 'discount') sortOption = { discount: -1 };
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Product.countDocuments(query);
        
        const products = await Product.find(query)
            .populate('seller', 'fullName businessName email phoneNo')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        console.log(`Found ${products.length} products matching filters`);
        
        // Transform products data for response (don't include full image buffers)
        const productsForResponse = products.map(product => {
            const discountedPrice = product.discount > 0 
                ? product.price * (1 - product.discount / 100)
                : product.price;
            
            return {
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                discount: product.discount || 0,
                discountedPrice: discountedPrice.toFixed(2),
                category: product.category,
                brand: product.brand,
                stock: product.stock,
                isActive: product.isActive,
                seller: product.seller,
                createdAt: product.createdAt,
                imageCount: product.images ? product.images.length : 0,
                // Provide image URLs instead of raw data
                imageUrls: product.images ? product.images.map((_, index) => 
                    `/images/product/${product._id}/${index}`
                ) : [],
                // Provide first image URL as thumbnail
                thumbnail: product.images && product.images.length > 0 ? 
                    `/images/product/${product._id}/0` : null
            };
        });
        
        res.json({
            success: true,
            data: {
                products: productsForResponse,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    category: category || null,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    brand: brand || null,
                    search: search || null,
                    sortBy: sortBy || 'newest'
                }
            }
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching products',
            message: err.message
        });
    }
});

// Get filter options (categories, brands)
router.get('/filter-options', async (req, res) => {
    try {
        // Get distinct brands from database
        const distinctBrands = await Product.distinct('brand');
        
        const brands = distinctBrands
            .filter(brand => brand) // Remove null/undefined
            .map(brand => ({
                value: brand,
                label: brand
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        res.json({
            success: true,
            data: {
                categories: [
                    { value: 'petfood', label: 'Pet Food', dbValue: 'Pet Food' },
                    { value: 'toys', label: 'Toys', dbValue: 'Toys' },
                    { value: 'accessories', label: 'Accessories', dbValue: 'Accessories' }
                ],
                brands,
                sortOptions: [
                    { value: 'newest', label: 'Newest First' },
                    { value: 'price-asc', label: 'Price: Low to High' },
                    { value: 'price-desc', label: 'Price: High to Low' },
                    { value: 'name-asc', label: 'Name: A to Z' },
                    { value: 'name-desc', label: 'Name: Z to A' },
                    { value: 'discount', label: 'Highest Discount' }
                ]
            }
        });
    } catch (err) {
        console.error('Error fetching filter options:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching filter options',
            message: err.message
        });
    }
});

// Get products by category (alternative endpoint for backwards compatibility)
router.get('/category/:category', async (req, res) => {
    try {
        const categoryMap = {
            'petfood': 'Pet Food',
            'toys': 'Toys',
            'accessories': 'Accessories'
        };

        const category = req.params.category.toLowerCase();
        const categoryTitle = categoryMap[category] || 'Products';

        const products = await Product.find({ 
            category: categoryTitle,
            isActive: true 
        })
        .populate('seller', 'businessName fullName')
        .lean();

        const productsForResponse = products.map(product => {
            const discountedPrice = product.discount > 0 
                ? product.price * (1 - product.discount / 100)
                : product.price;

            return {
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                discount: product.discount || 0,
                discountedPrice: discountedPrice.toFixed(2),
                category: product.category,
                brand: product.brand,
                stock: product.stock,
                seller: product.seller,
                thumbnail: product.images && product.images.length > 0 ? 
                    `/images/product/${product._id}/0` : null
            };
        });

        res.json({
            success: true,
            data: {
                categoryTitle,
                category: categoryTitle,
                products: productsForResponse,
                total: productsForResponse.length,
                categoryFilters: [
                    { id: 'petfood', value: 'petfood', label: 'Pet Food' },
                    { id: 'toys', value: 'toys', label: 'Toys' },
                    { id: 'accessories', value: 'accessories', label: 'Accessories' }
                ]
            }
        });
    } catch (err) {
        console.error('Error loading products by category:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading products',
            message: err.message
        });
    }
});

// Get single product details by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'fullName businessName email phoneNo')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Calculate discounted price
        const discountedPrice = product.discount > 0 
            ? product.price * (1 - product.discount / 100)
            : product.price;

        // Find similar products (same category, different id)
        const similarProducts = await Product.find({ 
            category: product.category,
            _id: { $ne: product._id },
            isActive: true
        })
        .limit(4)
        .lean();

        // Transform product data
        const productForResponse = {
            ...product,
            discountedPrice: discountedPrice.toFixed(2),
            savings: product.discount > 0 
                ? (product.price - discountedPrice).toFixed(2) 
                : 0,
            imageCount: product.images ? product.images.length : 0,
            imageUrls: product.images ? product.images.map((_, index) => 
                `/images/product/${product._id}/${index}`
            ) : [],
            thumbnail: product.images && product.images.length > 0 ? 
                `/images/product/${product._id}/0` : null
        };

        // Remove raw image data
        delete productForResponse.images;

        // Transform similar products
        const similarProductsForResponse = similarProducts.map(p => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            discount: p.discount || 0,
            discountedPrice: p.discount > 0 
                ? (p.price * (1 - p.discount / 100)).toFixed(2)
                : p.price.toFixed(2),
            thumbnail: p.images && p.images.length > 0 ? 
                `/images/product/${p._id}/0` : null
        }));

        res.json({
            success: true,
            data: {
                product: productForResponse,
                similarProducts: similarProductsForResponse
            }
        });
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching product details',
            message: err.message
        });
    }
});

// Create new product (sellers only)
router.post('/add', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
    try {
        console.log('=== PRODUCT SUBMISSION ===');
        console.log('Request body:', req.body);
        console.log('Files received:', req.files ? req.files.length : 'none');
        console.log('User authenticated:', req.user ? req.user._id : 'NO USER');

        // Validation
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'At least one image is required' 
            });
        }

        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'category', 'stock'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                missingFields
            });
        }

        // Validate price and stock
        const price = parseFloat(req.body.price);
        const stock = parseInt(req.body.stock);
        
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be a positive number'
            });
        }

        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                error: 'Stock must be a non-negative number'
            });
        }

        const images = req.files.map(file => ({
            data: file.buffer,
            contentType: file.mimetype
        }));

        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: price,
            discount: parseFloat(req.body.discount) || 0,
            category: req.body.category,
            brand: req.body.brand || '',
            stock: stock,
            seller: req.user._id,
            images: images,
            isActive: true
        };

        console.log('Creating new product with data:', {
            name: productData.name,
            price: productData.price,
            category: productData.category,
            stock: productData.stock
        });

        const newProduct = await Product.create(productData);
        console.log('Successfully created product with ID:', newProduct._id);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                productId: newProduct._id,
                name: newProduct.name,
                price: newProduct.price
            }
        });
    } catch (err) {
        console.error('Product creation error:', err);
        console.error('Error stack:', err.stack);
        
        res.status(400).json({
            success: false,
            error: err.message || 'Error creating product',
            message: err.message
        });
    }
});

// Get user's own products (sellers)
router.get('/my/listings', isAuthenticated, isSeller, async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        const productsForResponse = products.map(product => {
            const discountedPrice = product.discount > 0 
                ? product.price * (1 - product.discount / 100)
                : product.price;

            return {
                ...product,
                discountedPrice: discountedPrice.toFixed(2),
                imageCount: product.images ? product.images.length : 0,
                imageUrls: product.images ? product.images.map((_, index) => 
                    `/images/product/${product._id}/${index}`
                ) : [],
                thumbnail: product.images && product.images.length > 0 ? 
                    `/images/product/${product._id}/0` : null
            };
        });

        // Remove raw image data
        productsForResponse.forEach(product => delete product.images);

        res.json({
            success: true,
            data: {
                products: productsForResponse,
                total: productsForResponse.length
            }
        });
    } catch (err) {
        console.error('Error fetching seller products:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching your products',
            message: err.message
        });
    }
});

// Update product (owner only)
router.patch('/:id', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found or you do not have permission to edit it'
            });
        }

        // Update basic fields if provided
        if (req.body.name) product.name = req.body.name;
        if (req.body.description) product.description = req.body.description;
        if (req.body.price) product.price = parseFloat(req.body.price);
        if (req.body.discount !== undefined) product.discount = parseFloat(req.body.discount) || 0;
        if (req.body.category) product.category = req.body.category;
        if (req.body.brand !== undefined) product.brand = req.body.brand;
        if (req.body.stock !== undefined) product.stock = parseInt(req.body.stock);

        // Handle existing images (if keepImages is provided)
        if (req.body.keepImages) {
            const keepImages = Array.isArray(req.body.keepImages) 
                ? req.body.keepImages 
                : [req.body.keepImages];
            
            const updatedImages = [];
            product.images.forEach((image, index) => {
                if (keepImages.includes(index.toString()) || keepImages[index] !== 'false') {
                    updatedImages.push(image);
                }
            });
            
            product.images = updatedImages;
        }

        // Add new images if provided
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
            
            product.images = [...(product.images || []), ...newImages];
        }

        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                productId: product._id,
                name: product.name
            }
        });
    } catch (err) {
        console.error('Product update error:', err);
        res.status(400).json({
            success: false,
            error: 'Error updating product',
            message: err.message
        });
    }
});

// Toggle product active status (owner only)
router.patch('/:id/toggle', isAuthenticated, isSeller, async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found or you do not have permission to edit it'
            });
        }

        // Toggle the active status
        product.isActive = !product.isActive;
        await product.save();

        res.json({
            success: true,
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                productId: product._id,
                isActive: product.isActive
            }
        });
    } catch (err) {
        console.error('Product toggle error:', err);
        res.status(400).json({
            success: false,
            error: 'Error toggling product status',
            message: err.message
        });
    }
});

// Delete product (owner only)
router.delete('/:id', isAuthenticated, isSeller, async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found or you do not have permission to delete it'
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product',
            message: err.message
        });
    }
});

// Get product image (binary data for <img> tags)
router.get('/image/:productId/:index', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        const imageIndex = parseInt(req.params.index);
        
        if (!product || !product.images || !product.images[imageIndex]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }
        
        const image = product.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(image.data);
    } catch (err) {
        console.error('Image load error:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading image',
            message: err.message
        });
    }
});

module.exports = router;