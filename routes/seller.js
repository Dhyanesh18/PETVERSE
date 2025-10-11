const express = require('express');
const router = express.Router();
const Seller = require('../models/seller');
const Order = require('../models/order');
const Product = require('../models/products');
const Review = require('../models/reviews');
const { isAuthenticated } = require('../middleware/auth');
const sellerAuth = require('../middleware/sellerAuth');
const Pet = require('../models/pets');

// Dashboard view
router.get('/dashboard', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        console.log('Dashboard route - User ID:', req.user._id);
        console.log('User role:', req.user.role);
        
        // Allow admin to view seller dashboard; otherwise require seller
        const seller = req.user.role === 'seller' ? req.user : (req.user.role === 'admin' ? await Seller.findOne({ _id: req.user._id }) : null);
        
        if (!seller && req.user.role !== 'admin') {
            console.error('Seller not found for ID:', req.user._id);
            return res.status(404).render('error', { 
                message: 'Seller not found. Make sure you are logged in with a seller account.' 
            });
        }

        console.log('Seller found:', seller.email);

        // Fetch seller's products
        const products = await Product.find({ seller: seller._id });
        console.log(`Found ${products.length} products for seller`);

        const pets = await Pet.find({addedBy: seller._id});
        console.log(`Found ${pets.length} pets for seller`);
        // Get recent orders
        const recentOrders = await Order.find({ seller: seller._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name email')
            .populate('items.product', 'name price');

        // Get order statistics
        const totalOrders = await Order.countDocuments({ seller: seller._id });
        const pendingOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: 'pending' 
        });
        const processingOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: 'processing' 
        });

        // Calculate total revenue
        const revenue = await Order.aggregate([
            { $match: { seller: seller._id, paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        // Format products for display
        const formattedProducts = products.map(product => ({
            _id: product._id,
            title: product.name,
            price: product.price,
            stock: product.stock,
            status: product.stock > 0 ? 'active' : 'inactive',
            image_url: product.images && product.images.length > 0 ? 
                `data:${product.images[0].contentType};base64,${product.images[0].data.toString('base64')}` : 
                'default-product.jpg',
            dis: product.discount ? `${product.discount}%` : '0%'
        }));

        // Get recent orders for display
        const sellerOrders = await Order.find({ seller: seller._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'fullName email')
            .populate('items.product');

        // Format orders for display
        const formattedOrders = sellerOrders.map(order => ({
            _id: order._id,
            customer: { name: order.customer?.fullName || 'Customer' },
            items: order.items.map(item => ({
                product: { name: item.product?.name || 'Product' },
                quantity: item.quantity,
                seller: item.seller || seller._id
            })),
            total: order.totalAmount || 0,
            status: order.status || 'pending'
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
        .limit(10);
        
        console.log(`Found ${productReviews.length} reviews for seller's products`);
        
        // Also fetch direct seller reviews
        const sellerReviews = await Review.find({
            targetType: 'Seller',
            targetId: seller._id
        })
        .populate('user', 'fullName username')
        .sort({ createdAt: -1 })
        .limit(5);
        
        console.log(`Found ${sellerReviews.length} reviews for seller directly`);
        
        // Combine reviews
        const allReviews = [...productReviews, ...sellerReviews];
        
        // Format reviews for display
        const formattedReviews = allReviews.map(review => ({
            _id: review._id,
            product: {
                name: review.targetType === 'Product' ? 
                    (review.targetId?.name || 'Product') : 
                    'Seller Review'
            },
            rating: review.rating,
            comment: review.comment,
            user: {
                name: review.user?.fullName || review.user?.username || 'Customer'
            },
            createdAt: review.createdAt,
            reply: review.reply
        }));
        
        // Calculate average rating
        let totalRating = 0;
        allReviews.forEach(review => {
            totalRating += review.rating;
        });
        const averageRating = allReviews.length > 0 ? 
            (totalRating / allReviews.length).toFixed(1) : 0;

        const totalSales = revenue[0]?.total || 0;

        res.render('seller-dashboard', {
            user: {
                name: seller.fullName || seller.businessName || 'Seller',
                _id: seller._id
            },
            seller: {
                businessName: seller.businessName || 'Your Business',
                businessAddress: seller.businessAddress || 'Your Address'
            },
            orders: {
                recent: recentOrders,
                statistics: {
                    total: totalOrders,
                    pending: pendingOrders,
                    processing: processingOrders
                }
            },
            products: formattedProducts,
            pets: pets,
            sellerOrders: formattedOrders,
            reviews: formattedReviews,
            totalSales: totalSales,
            pendingOrders: pendingOrders,
            rating: averageRating,
            revenue: revenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { message: 'Error fetching dashboard data: ' + error.message });
    }
});

// Orders view
router.get('/orders', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        const orders = await Order.find({ seller: req.user._id })
            .sort({ createdAt: -1 })
            .populate('customer', 'name email')
            .populate('items.product', 'name price');
        
        res.render('seller-orders', { orders });
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching orders' });
    }
});

// Update order status
router.post('/orders/:orderId/status', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOne({
            _id: req.params.orderId,
            seller: req.user._id
        });

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.redirect('/seller/orders');
    } catch (error) {
        res.status(500).render('error', { message: 'Error updating order status' });
    }
});

// Profile view
router.get('/profile', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        const seller = await Seller.findById(req.user._id)
            .select('-password');
        
        if (!seller) {
            return res.status(404).render('error', { message: 'Seller not found' });
        }

        res.render('seller-profile', { seller });
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching seller profile' });
    }
});

// Update profile
router.post('/profile', isAuthenticated, sellerAuth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['businessName', 'businessAddress', 'taxId'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).render('error', { message: 'Invalid updates' });
    }

    try {
        const seller = await Seller.findById(req.user._id);
        
        if (!seller) {
            return res.status(404).render('error', { message: 'Seller not found' });
        }

        updates.forEach(update => seller[update] = req.body[update]);
        await seller.save();

        res.redirect('/seller/profile');
    } catch (error) {
        res.status(500).render('error', { message: 'Error updating seller profile' });
    }
});

module.exports = router; 