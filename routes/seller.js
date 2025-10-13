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
        console.log('Seller ID:', seller._id);

        // Debug: Check ALL orders in database
        const allOrders = await Order.find({});
        console.log('Total orders in database:', allOrders.length);
        console.log('All orders:', allOrders.map(o => ({ 
            id: o._id, 
            seller: o.seller, 
            status: o.status,
            sellerMatch: o.seller?.toString() === seller._id.toString()
        })));

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
        
        // Debug: Check all orders for this seller
        const allSellerOrders = await Order.find({ seller: seller._id });
        console.log('All orders for seller:', allSellerOrders.length);
        console.log('Order details:', allSellerOrders.map(o => ({ 
            id: o._id, 
            status: o.status, 
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            totalAmount: o.totalAmount
        })));
        
        // Update paymentStatus for delivered/completed orders
        // For online payments: mark as paid immediately
        // For COD: mark as paid only when delivered/completed
        // Also handle orders without paymentMethod (assume wallet/online payment)
        const updatePaymentStatus = await Order.updateMany(
            { 
                seller: seller._id,
                $or: [
                    // Online payments that are not COD should be marked paid
                    { 
                        paymentMethod: { $in: ['online', 'card', 'upi', 'wallet'] },
                        $or: [
                            { paymentStatus: { $exists: false } },
                            { paymentStatus: 'pending' }
                        ]
                    },
                    // COD orders marked as paid only when delivered/completed
                    {
                        paymentMethod: 'cod',
                        status: { $in: ['delivered', 'completed'] },
                        $or: [
                            { paymentStatus: { $exists: false } },
                            { paymentStatus: 'pending' }
                        ]
                    },
                    // Orders without paymentMethod - assume online payment
                    {
                        paymentMethod: { $exists: false },
                        $or: [
                            { paymentStatus: { $exists: false } },
                            { paymentStatus: 'pending' }
                        ]
                    }
                ]
            },
            { $set: { paymentStatus: 'paid', paymentMethod: 'wallet' } }
        );
        if (updatePaymentStatus.modifiedCount > 0) {
            console.log(`Updated ${updatePaymentStatus.modifiedCount} orders to paymentStatus: 'paid'`);
        }
        
        const pendingOrders = await Order.countDocuments({ 
            seller: seller._id, 
            status: { $in: ['pending', 'processing', 'shipped'] }
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
        
        console.log('Revenue calculation result:', revenue);
        console.log('Total Sales:', revenue[0]?.total || 0);

        // Format products for display
        const formattedProducts = products.map(product => {
            let imageUrl = '/images/default-product.jpg';

            if (product.images && product.images.length > 0) {
                const img = product.images[0];
                const base64Data = Buffer.from(img.data?.data || img.data).toString('base64');
                imageUrl = `data:${img.contentType};base64,${base64Data}`;
            }

            return {
                _id: product._id,
                title: product.name,
                price: product.price,
                stock: product.stock,
                status: product.stock > 0 ? 'active' : 'inactive',
                image_url: imageUrl,
                dis: product.discount ? `${product.discount}%` : '0%'
            };
        });
        console.log('First product image_url:', formattedProducts[0]?.image_url?.slice(0, 100));


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

        // Final debug before render
        console.log('=== FINAL DEBUG ===');
        console.log('Pending Orders Count:', pendingOrders);
        console.log('Total Orders Count:', totalOrders);
        console.log('Formatted Orders:', formattedOrders.length);
        
        res.render('seller-dashboard', {
            user: {
                name: seller.fullName || seller.businessName || 'Seller',
                _id: seller._id,
                email: seller.email || 'N/A',
                phone: seller.phone || 'N/A'
            },
            seller: {
                businessName: seller.businessName || 'Your Business',
                businessAddress: seller.businessAddress || 'Your Address',
                email: seller.email || 'N/A',
                phone: seller.phone || 'N/A'
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
            revenue: revenue[0]?.total || 0,
            debugInfo: {
                sellerId: seller._id.toString(),
                allOrdersCount: allOrders.length,
                ordersForSeller: allSellerOrders.length
            }
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

// View single order details
router.get('/orders/:orderId', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            seller: req.user._id
        })
        .populate('customer', 'fullName email phone address')
        .populate('items.product', 'name price images');

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        res.render('seller-order-details', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { message: 'Error fetching order details' });
    }
});

// Edit order route (redirect to details for now)
router.get('/order/:orderId/edit', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        // For now, redirect to order details
        // In the future, this could show an edit form
        res.redirect(`/seller/orders/${req.params.orderId}`);
    } catch (error) {
        console.error('Error accessing order edit:', error);
        res.status(500).render('error', { message: 'Error accessing order edit page' });
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

// Update order status (API endpoint for AJAX)
router.post('/order/:orderId/status', isAuthenticated, sellerAuth, async (req, res) => {
    try {
        const { status } = req.body;
        console.log('Update order status request:', { orderId: req.params.orderId, status, userId: req.user._id });
        
        const order = await Order.findOne({
            _id: req.params.orderId,
            seller: req.user._id
        });

        if (!order) {
            console.log('Order not found for seller');
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        console.log('Current order status:', order.status);
        console.log('Updating to:', status);
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.log('Invalid status:', status);
            return res.status(400).json({ success: false, error: 'Invalid status value' });
        }
        
        order.status = status;
        await order.save();
        
        console.log('Order status updated successfully');
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, error: 'Error updating order status: ' + error.message });
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