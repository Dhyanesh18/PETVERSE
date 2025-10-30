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

        // Get recent orders
        const recentOrders = await Order.find({ seller: seller._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('customer', 'fullName email')
            .populate('items.product', 'name price images')
            .lean();

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

module.exports = router;