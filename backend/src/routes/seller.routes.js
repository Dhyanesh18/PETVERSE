const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/products');
const Review = require('../models/reviews');
const Pet = require('../models/pets');
const Wallet = require('../models/wallet');
const Transaction = require('../models/transaction');
const User = require('../models/users');

// Middleware to check if user is authenticated
async function isAuthenticated(req, res, next) {
    console.log('Seller auth - Session userId:', req.session.userId);
    console.log('Seller auth - User object:', req.user);
    console.log('Seller auth - Session userRole:', req.session.userRole);
    
    if (req.session.userId) {
        // If user object is not attached but session exists, try to reload user
        if (!req.user) {
            try {
                const User = require('../models/users');
                req.user = await User.findById(req.session.userId);
                console.log('Seller auth - Reloaded user:', req.user);
            } catch (error) {
                console.error('Seller auth - Error reloading user:', error);
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    redirectPath: '/login'
                });
            }
        }
        
        if (req.user) {
            return next();
        }
    }
    
    res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirectPath: '/login'
    });
}

// Middleware to check if user is a seller
function isSeller(req, res, next) {
    console.log('Seller role check - User:', req.user);
    console.log('Seller role check - User role:', req.user?.role);
    
    if (req.user && req.user.role === 'seller') {
        console.log('Seller role check - PASSED');
        return next();
    }
    
    console.log('Seller role check - FAILED');
    res.status(403).json({
        success: false,
        error: 'Access denied. Sellers only.'
    });
}

// Get seller dashboard data
router.get('/dashboard', isAuthenticated, isSeller, async (req, res) => {
    try {
        const seller = req.user;
        
        console.log('Dashboard route - User ID:', seller._id);
        console.log('User role:', seller.role);

        // Fetch seller's products
        const products = await Product.find({ seller: seller._id }).lean();
        console.log(`Found ${products.length} products for seller`);

        // Fetch seller's pets
        const pets = await Pet.find({ addedBy: seller._id }).lean();
        console.log(`Found ${pets.length} pets for seller`);

        // Update payment status for orders
        await Order.updateMany(
            { 
                seller: seller._id,
                $or: [
                    { 
                        paymentMethod: { $in: ['online', 'card', 'upi', 'wallet'] },
                        $or: [
                            { paymentStatus: { $exists: false } },
                            { paymentStatus: 'pending' }
                        ]
                    },
                    {
                        paymentMethod: 'cod',
                        status: { $in: ['delivered', 'completed'] },
                        $or: [
                            { paymentStatus: { $exists: false } },
                            { paymentStatus: 'pending' }
                        ]
                    },
                    {
                        paymentMethod: { $exists: false },
                        $or: [
                            { paymentStatus: { $exists: false } },
                            { paymentStatus: 'pending' }
                        ]
                    }
                ]
            },
            { $set: { paymentStatus: 'paid' } }
        );

        // Get order statistics
        const totalOrders = await Order.countDocuments({ seller: seller._id });
        const pendingOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: { $in: ['pending', 'processing', 'shipped'] }
        });
        const processingOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: 'processing' 
        });
        const completedOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: { $in: ['delivered', 'completed'] }
        });
        const cancelledOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: 'cancelled' 
        });

        // Calculate total revenue
        const revenue = await Order.aggregate([
            { 
                $match: { 
                    seller: seller._id, 
                    paymentStatus: 'paid',
                    status: { $ne: 'cancelled' }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        const totalRevenue = revenue[0]?.total || 0;
        console.log('Total Revenue:', totalRevenue);

        // Get recent orders with proper population
        const recentOrders = await Order.find({ seller: seller._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('customer', 'fullName email')
            .lean();
            
        // Manually populate product/pet references since we're using refPath
        for (let order of recentOrders) {
            if (order.items && order.items.length > 0) {
                for (let item of order.items) {
                    const originalProductId = item.product;
                    console.log('Processing item with productId:', originalProductId, 'itemType:', item.itemType);
                    
                    if (item.itemType === 'Product' || !item.itemType) {
                        // Default to Product if itemType is not set
                        const product = await Product.findById(originalProductId).select('name price images').lean();
                        if (product) {
                            item.product = product;
                            console.log('Found product:', product.name);
                        } else {
                            console.log('Product not found for ID:', originalProductId);
                            item.product = { _id: originalProductId, name: 'Product Not Found' };
                        }
                    } else if (item.itemType === 'Pet') {
                        const pet = await Pet.findById(originalProductId).select('name price images').lean();
                        if (pet) {
                            item.product = pet;
                            console.log('Found pet:', pet.name);
                        } else {
                            console.log('Pet not found for ID:', originalProductId);
                            item.product = { _id: originalProductId, name: 'Pet Not Found' };
                        }
                    }
                }
            }
        }
        
        console.log('Sample order after population:', JSON.stringify(recentOrders[0]?.items?.[0], null, 2));

        // Format orders for display
        const formattedOrders = recentOrders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            customer: {
                _id: order.customer?._id,
                name: order.customer?.fullName || 'Customer',
                email: order.customer?.email
            },
            items: order.items.map(item => ({
                product: {
                    _id: item.product?._id,
                    name: item.product?.name || 'Product',
                    image: item.product?.images?.[0] 
                        ? `/images/product/${item.product._id}/0` 
                        : null
                },
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: order.totalAmount || 0,
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'pending',
            paymentMethod: order.paymentMethod || 'wallet',
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress
        }));

        // Format products for display
        const formattedProducts = products.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            discount: product.discount || 0,
            stock: product.stock,
            category: product.category,
            brand: product.brand,
            isActive: product.isActive !== false,
            status: product.stock > 0 ? 'In Stock' : 'Out of Stock',
            thumbnail: product.images && product.images.length > 0 
                ? `/images/product/${product._id}/0` 
                : null
        }));

        // Format pets for display
        const formattedPets = pets.map(pet => ({
            _id: pet._id,
            name: pet.name,
            breed: pet.breed,
            category: pet.category,
            price: pet.price,
            age: pet.age,
            gender: pet.gender,
            available: pet.available !== false,
            thumbnail: pet.images && pet.images.length > 0 
                ? `/images/pet/${pet._id}/0` 
                : null
        }));

        // Get product IDs for this seller
        const productIds = products.map(product => product._id);
        
        // Fetch reviews for seller's products
        const productReviews = await Review.find({
            targetType: 'Product',
            targetId: { $in: productIds }
        })
        .populate('user', 'fullName username')
        .populate('targetId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
        
        // Also fetch direct seller reviews
        const sellerReviews = await Review.find({
            targetType: 'Seller',
            targetId: seller._id
        })
        .populate('user', 'fullName username')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        
        // Combine and format reviews
        const allReviews = [...productReviews, ...sellerReviews];
        const formattedReviews = allReviews.map(review => ({
            _id: review._id,
            type: review.targetType,
            productName: review.targetType === 'Product' ? 
                (review.targetId?.name || 'Product') : 
                'Seller Review',
            rating: review.rating,
            comment: review.comment,
            user: {
                _id: review.user?._id,
                name: review.user?.fullName || review.user?.username || 'Customer'
            },
            createdAt: review.createdAt,
            reply: review.reply
        }));
        
        // Calculate average rating
        const averageRating = allReviews.length > 0 
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
            : 0;

        // Get wallet balance
        const wallet = await Wallet.findOne({ user: seller._id });
        const walletBalance = wallet ? wallet.balance : 0;

        res.json({
            success: true,
            data: {
                seller: {
                    _id: seller._id,
                    name: seller.fullName || seller.businessName || 'Seller',
                    businessName: seller.businessName || 'Your Business',
                    businessAddress: seller.businessAddress || '',
                    email: seller.email,
                    phoneNo: seller.phoneNo || seller.phone,
                    profilePicture: seller.profilePicture 
                        ? `/images/user/${seller._id}/profile` 
                        : null
                },
                statistics: {
                    totalOrders,
                    pendingOrders,
                    processingOrders,
                    completedOrders,
                    cancelledOrders,
                    totalRevenue: totalRevenue.toFixed(2),
                    walletBalance: walletBalance.toFixed(2),
                    averageRating: parseFloat(averageRating),
                    totalProducts: products.length,
                    totalPets: pets.length,
                    totalReviews: allReviews.length
                },
                recentOrders: formattedOrders,
                products: formattedProducts,
                pets: formattedPets,
                reviews: formattedReviews
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching dashboard data',
            message: error.message
        });
    }
});

// Get all seller orders with filters
router.get('/orders', isAuthenticated, isSeller, async (req, res) => {
    try {
        const { status, page = 1, limit = 20, sortBy = 'newest' } = req.query;
        
        let query = { seller: req.user._id };
        
        // Filter by status if provided
        if (status && status !== 'all') {
            query.status = status;
        }

        // Build sort option
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };
        if (sortBy === 'amount-high') sortOption = { totalAmount: -1 };
        if (sortBy === 'amount-low') sortOption = { totalAmount: 1 };

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('customer', 'fullName email phoneNo')
            .populate('items.product', 'name price images')
            .lean();
        
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            customer: {
                _id: order.customer?._id,
                name: order.customer?.fullName || 'Customer',
                email: order.customer?.email,
                phone: order.customer?.phoneNo
            },
            items: order.items.map(item => ({
                product: {
                    _id: item.product?._id,
                    name: item.product?.name || 'Product',
                    image: item.product?.images?.[0] 
                        ? `/images/product/${item.product._id}/0` 
                        : null
                },
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: order.totalAmount || 0,
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'pending',
            paymentMethod: order.paymentMethod || 'wallet',
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress
        }));

        res.json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    status: status || 'all',
                    sortBy: sortBy || 'newest'
                }
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching orders',
            message: error.message
        });
    }
});

// Get single order details
router.get('/orders/:orderId', isAuthenticated, isSeller, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            seller: req.user._id
        })
        .populate('customer', 'fullName email phoneNo address')
        .populate('items.product', 'name price images description')
        .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const formattedOrder = {
            _id: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            customer: {
                _id: order.customer?._id,
                name: order.customer?.fullName || 'Customer',
                email: order.customer?.email,
                phone: order.customer?.phoneNo,
                address: order.customer?.address
            },
            items: order.items.map(item => ({
                product: {
                    _id: item.product?._id,
                    name: item.product?.name || 'Product',
                    description: item.product?.description,
                    images: item.product?.images?.map((_, index) => 
                        `/images/product/${item.product._id}/${index}`
                    ) || []
                },
                quantity: item.quantity,
                price: item.price,
                subtotal: (item.quantity * item.price).toFixed(2)
            })),
            totalAmount: order.totalAmount || 0,
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'pending',
            paymentMethod: order.paymentMethod || 'wallet',
            shippingAddress: order.shippingAddress || {},
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            statusHistory: order.statusHistory || []
        };

        res.json({
            success: true,
            data: {
                order: formattedOrder
            }
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching order details',
            message: error.message
        });
    }
});

// Update order status
router.patch('/orders/:orderId/status', isAuthenticated, isSeller, async (req, res) => {
    try {
        const { status } = req.body;
        console.log('Update order status request:', { 
            orderId: req.params.orderId, 
            status, 
            userId: req.user._id 
        });
        
        const order = await Order.findOne({
            _id: req.params.orderId,
            seller: req.user._id
        }).populate('customer');

        if (!order) {
            console.log('Order not found for seller');
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        console.log('Current order status:', order.status);
        console.log('Updating to:', status);
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.log('Invalid status:', status);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid status value',
                validStatuses 
            });
        }
        
        const oldStatus = order.status;
        
        // Handle cancellation - refund customer and deduct from seller
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            console.log('Processing cancellation refund...');
            
            // Get wallets
            const customerWallet = await Wallet.findOne({ user: order.customer._id });
            const sellerWallet = await Wallet.findOne({ user: req.user._id });
            
            if (!customerWallet) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Customer wallet not found' 
                });
            }
            
            if (!sellerWallet) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Seller wallet not found' 
                });
            }
            
            const refundAmount = order.totalAmount;
            const sellerShare = refundAmount * 0.95; // Seller received 95% of the order
            const adminCommission = refundAmount * 0.05; // Admin received 5%
            
            // Refund customer
            await customerWallet.addFunds(refundAmount);
            console.log(`Refunded ₹${refundAmount} to customer`);
            
            // Deduct from seller (only their share)
            try {
                await sellerWallet.deductFunds(sellerShare);
                console.log(`Deducted ₹${sellerShare} from seller`);
            } catch (err) {
                console.error('Seller has insufficient balance for refund:', err.message);
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient seller balance for refund'
                });
            }
            
            // Deduct from admin wallet
            const adminWallet = await Wallet.findOne({ user: "6807e4424877bcd9980c7e00" });
            if (adminWallet) {
                try {
                    await adminWallet.deductFunds(adminCommission);
                    console.log(`Deducted ₹${adminCommission} commission from admin`);
                } catch (err) {
                    console.error('Admin has insufficient balance for refund:', err.message);
                }
            }
            
            // Create refund transaction records
            await new Transaction({
                from: req.user._id,
                to: order.customer._id,
                amount: refundAmount,
                type: 'refund',
                description: `Refund for cancelled order ${order._id}`
            }).save();
            
            // Update payment status to refunded
            order.paymentStatus = 'refunded';
            console.log('Refund completed successfully');
        }
        
        // Update status
        order.status = status;
        
        // Add to status history
        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        
        await order.save();
        
        console.log('Order status updated successfully');
        res.json({ 
            success: true, 
            message: 'Order status updated successfully',
            data: {
                orderId: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus
            }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error updating order status',
            message: error.message 
        });
    }
});

// Get seller profile
router.get('/profile', isAuthenticated, isSeller, async (req, res) => {
    try {
        const seller = await User.findById(req.user._id)
            .select('-password')
            .lean();
        
        if (!seller) {
            return res.status(404).json({
                success: false,
                error: 'Seller not found'
            });
        }

        // Get wallet info
        const wallet = await Wallet.findOne({ user: seller._id });

        res.json({
            success: true,
            data: {
                seller: {
                    _id: seller._id,
                    fullName: seller.fullName,
                    businessName: seller.businessName,
                    businessAddress: seller.businessAddress,
                    email: seller.email,
                    phoneNo: seller.phoneNo,
                    role: seller.role,
                    profilePicture: seller.profilePicture 
                        ? `/images/user/${seller._id}/profile` 
                        : null,
                    license: seller.license 
                        ? `/images/document/license/${seller._id}` 
                        : null,
                    walletBalance: wallet ? wallet.balance.toFixed(2) : '0.00',
                    createdAt: seller.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Error fetching seller profile:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching seller profile',
            message: error.message
        });
    }
});

// Update seller profile
router.patch('/profile', isAuthenticated, isSeller, async (req, res) => {
    try {
        const allowedUpdates = ['businessName', 'businessAddress', 'phoneNo'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({
                success: false,
                error: 'Invalid updates',
                allowedFields: allowedUpdates
            });
        }

        const seller = await User.findById(req.user._id);
        
        if (!seller) {
            return res.status(404).json({
                success: false,
                error: 'Seller not found'
            });
        }

        updates.forEach(update => seller[update] = req.body[update]);
        await seller.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                seller: {
                    _id: seller._id,
                    fullName: seller.fullName,
                    businessName: seller.businessName,
                    businessAddress: seller.businessAddress,
                    phoneNo: seller.phoneNo
                }
            }
        });
    } catch (error) {
        console.error('Error updating seller profile:', error);
        res.status(400).json({
            success: false,
            error: 'Error updating seller profile',
            message: error.message
        });
    }
});

// Get seller analytics/statistics
router.get('/analytics', isAuthenticated, isSeller, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Revenue over time
        const revenueByDate = await Order.aggregate([
            {
                $match: {
                    seller: req.user._id,
                    paymentStatus: 'paid',
                    status: { $ne: 'cancelled' },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top selling products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    seller: req.user._id,
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Populate product details
        await Product.populate(topProducts, { path: '_id', select: 'name images' });

        const formattedTopProducts = topProducts.map(item => ({
            productId: item._id._id,
            name: item._id.name,
            thumbnail: item._id.images?.[0] 
                ? `/images/product/${item._id._id}/0` 
                : null,
            totalSold: item.totalSold,
            revenue: item.revenue.toFixed(2)
        }));

        // Order status distribution
        const statusDistribution = await Order.aggregate([
            { $match: { seller: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                period: parseInt(period),
                revenueByDate,
                topProducts: formattedTopProducts,
                statusDistribution,
                startDate
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching analytics',
            message: error.message
        });
    }
});

// Product Management Routes
const multer = require('multer');
const path = require('path');

// Configure multer for product images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
        }
    }
});

// Add new product
router.post('/products', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        
        console.log('Creating new product:', { name, category, price, stock });
        console.log('Files uploaded:', req.files?.length || 0);

        // Validation
        if (!name || !description || !price || !category || !stock) {
            return res.status(400).json({
                success: false,
                error: 'All required fields must be provided'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one product image is required'
            });
        }

        // Process images for file system storage
        const imagePaths = req.files.map(file => `/images/products/${file.filename}`);

        // Create product
        const product = new Product({
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category: category.trim(),
            stock: parseInt(stock),
            images: imagePaths,
            seller: req.user._id,
            available: true
        });

        await product.save();

        console.log('Product created successfully:', product._id);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                product: {
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    brand: product.brand,
                    stock: product.stock,
                    discount: product.discount,
                    imageCount: product.images.length
                }
            }
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating product',
            message: error.message
        });
    }
});

// Get product for editing
router.get('/products/:productId/edit', isAuthenticated, isSeller, async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.productId,
            seller: req.user._id
        }).select('-images.data'); // Exclude binary image data for performance

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                brand: product.brand,
                discount: product.discount,
                stock: product.stock,
                available: product.available,
                images: product.images || []
            }
        });

    } catch (error) {
        console.error('Error fetching product for edit:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching product',
            message: error.message
        });
    }
});

// Update product
router.put('/products/:productId', isAuthenticated, isSeller, upload.array('newImages', 5), async (req, res) => {
    try {
        const { name, description, price, category, stock, imagesToDelete } = req.body;
        
        console.log('Updating product:', req.params.productId);
        console.log('New files uploaded:', req.files?.length || 0);

        const product = await Product.findOne({
            _id: req.params.productId,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Update basic fields
        if (name) product.name = name.trim();
        if (description) product.description = description.trim();
        if (price) product.price = parseFloat(price);
        if (category) product.category = category.trim();
        if (stock !== undefined) product.stock = parseInt(stock);

        // Handle image deletions
        if (imagesToDelete) {
            const imagesToDeleteArray = JSON.parse(imagesToDelete);
            product.images = product.images.filter(imagePath => !imagesToDeleteArray.includes(imagePath));
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const newImagePaths = req.files.map(file => `/images/products/${file.filename}`);
            product.images = [...product.images, ...newImagePaths];
        }

        await product.save();

        console.log('Product updated successfully:', product._id);

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                product: {
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    brand: product.brand,
                    stock: product.stock,
                    discount: product.discount,
                    imageCount: product.images.length
                }
            }
        });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating product',
            message: error.message
        });
    }
});

// Toggle product status (activate/deactivate)
router.patch('/products/:productId/toggle-status', isAuthenticated, isSeller, async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.productId,
            seller: req.user._id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        product.isActive = !product.isActive;
        product.updatedAt = new Date();
        await product.save();

        res.json({
            success: true,
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                productId: product._id,
                isActive: product.isActive
            }
        });

    } catch (error) {
        console.error('Error toggling product status:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating product status',
            message: error.message
        });
    }
});

// Pet Management Routes
const petStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/pets/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const petUpload = multer({
    storage: petStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
        }
    }
});

// Add new pet
router.post('/pets', isAuthenticated, isSeller, petUpload.array('images', 5), async (req, res) => {
    try {
        const { name, breed, age, price, category, description, gender, vaccinated, trained } = req.body;
        
        console.log('Creating new pet:', { name, breed, category, price, age });
        console.log('Files uploaded:', req.files?.length || 0);

        // Validation
        if (!name || !breed || !age || !price || !category) {
            return res.status(400).json({
                success: false,
                error: 'All required fields must be provided'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one pet image is required'
            });
        }

        // Process images for database storage
        const fs = require('fs');
        const images = [];
        
        for (const file of req.files) {
            const imageData = {
                data: fs.readFileSync(file.path),
                contentType: file.mimetype,
                filename: file.filename
            };
            images.push(imageData);
            
            // Clean up temporary file
            fs.unlinkSync(file.path);
        }

        // Create pet
        const pet = new Pet({
            name: name.trim(),
            breed: breed.trim(),
            age: age.trim(),
            price: parseFloat(price),
            category: category.trim(),
            description: description?.trim() || '',
            gender: gender || 'male',
            images: images,
            addedBy: req.user._id,
            available: true
        });

        await pet.save();

        console.log('Pet created successfully:', pet._id);

        res.status(201).json({
            success: true,
            message: 'Pet listing created successfully',
            data: {
                pet: {
                    _id: pet._id,
                    name: pet.name,
                    breed: pet.breed,
                    age: pet.age,
                    price: pet.price,
                    category: pet.category,
                    description: pet.description,
                    gender: pet.gender,
                    imageCount: pet.images.length
                }
            }
        });

    } catch (error) {
        console.error('Error creating pet:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating pet listing',
            message: error.message
        });
    }
});

// Get pet for editing
router.get('/pets/:petId/edit', isAuthenticated, isSeller, async (req, res) => {
    try {
        const pet = await Pet.findOne({
            _id: req.params.petId,
            addedBy: req.user._id
        });

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        res.json({
            success: true,
            pet: {
                _id: pet._id,
                name: pet.name,
                breed: pet.breed,
                age: pet.age,
                price: pet.price,
                category: pet.category,
                description: pet.description,
                gender: pet.gender,
                available: pet.available,
                images: pet.images || []
            }
        });

    } catch (error) {
        console.error('Error fetching pet for edit:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching pet',
            message: error.message
        });
    }
});

// Update pet
router.put('/pets/:petId', isAuthenticated, isSeller, petUpload.array('images', 5), async (req, res) => {
    try {
        const { name, breed, age, price, category, description, gender, keepExistingImages } = req.body;
        
        console.log('Updating pet:', req.params.petId);
        console.log('New files uploaded:', req.files?.length || 0);

        const pet = await Pet.findOne({
            _id: req.params.petId,
            addedBy: req.user._id
        });

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        // Update basic fields
        if (name) pet.name = name.trim();
        if (breed) pet.breed = breed.trim();
        if (age) pet.age = age.trim();
        if (price) pet.price = parseFloat(price);
        if (category) pet.category = category.trim();
        if (description !== undefined) pet.description = description.trim();
        if (gender) pet.gender = gender;

        // Handle image updates
        if (req.files && req.files.length > 0) {
            const fs = require('fs');
            const newImages = [];
            
            // Keep existing images if requested
            if (keepExistingImages === 'true') {
                newImages.push(...pet.images);
            }
            
            // Add new images
            for (const file of req.files) {
                if (newImages.length >= 5) break; // Max 5 images
                
                const imageData = {
                    data: fs.readFileSync(file.path),
                    contentType: file.mimetype,
                    filename: file.filename
                };
                newImages.push(imageData);
                
                // Clean up temporary file
                fs.unlinkSync(file.path);
            }

            if (newImages.length > 0) {
                pet.images = newImages;
            }
        }

        await pet.save();

        console.log('Pet updated successfully:', pet._id);

        res.json({
            success: true,
            message: 'Pet listing updated successfully',
            data: {
                pet: {
                    _id: pet._id,
                    name: pet.name,
                    breed: pet.breed,
                    age: pet.age,
                    price: pet.price,
                    category: pet.category,
                    description: pet.description,
                    gender: pet.gender,
                    imageCount: pet.images.length
                }
            }
        });

    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating pet listing',
            message: error.message
        });
    }
});

// Toggle pet status (available/unavailable)
router.patch('/pets/:petId/toggle-status', isAuthenticated, isSeller, async (req, res) => {
    try {
        const pet = await Pet.findOne({
            _id: req.params.petId,
            addedBy: req.user._id
        });

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        pet.available = !pet.available;
        await pet.save();

        res.json({
            success: true,
            message: `Pet marked as ${pet.available ? 'available' : 'unavailable'} successfully`,
            data: {
                petId: pet._id,
                available: pet.available
            }
        });

    } catch (error) {
        console.error('Error toggling pet status:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating pet status',
            message: error.message
        });
    }
});

module.exports = router;