const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const { isAuthenticated } = require('../middleware/auth');

// Get cart count
router.get('/count', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        const cartCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
        res.json({ success: true, cartCount });
    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({ success: false, message: 'Failed to get cart count' });
    }
});const validateCheckout = (req, res, next) => {
    const { fullName, email, phone, address, city, state, zipCode, country } = req.body;
    
    // Check if all required fields are present
    if (!fullName || !email || !phone || !address || !city || !state || !zipCode || !country) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid email format' 
        });
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid phone number format' 
        });
    }

    // Validate zip code (Indian format)
    const zipRegex = /^\d{6}$/;
    if (!zipRegex.test(zipCode)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid zip code format' 
        });
    }

    next();
};

// Process checkout
router.post('/checkout', validateCheckout, async (req, res) => {
    try {
        const { fullName, email, phone, address, city, state, zipCode, country } = req.body;
        
        // Get user's cart from database
        const cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate total amount
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.productId.price * item.quantity);
        }, 0);

        // Create shipping address object
        const shippingInfo = {
            fullName,
            email,
            phone,
            address,
            city,
            state,
            zipCode,
            country
        };

        // Store shipping info in session
        req.session.shippingInfo = shippingInfo;

        res.json({
            success: true,
            message: 'Checkout information validated successfully',
            data: {
                totalAmount,
                itemCount: cart.items.length
            }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during checkout'
        });
    }
});

// Process payment and create order
router.post('/process-payment', isAuthenticated, async (req, res) => {
    try {
        const { paymentMethod, paymentDetails } = req.body;
        
        // Debug: Log session userId
        console.log('Processing payment for userId:', req.session.userId);
        
        // Get user's cart
        const cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            console.log('Cart is empty or not found for user:', req.session.userId);
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Get shipping info from session
        const shippingInfo = req.session.shippingInfo;
        console.log('Shipping info from session:', shippingInfo);
        if (!shippingInfo) {
            console.log('Shipping info not found in session for user:', req.session.userId);
            return res.status(400).json({
                success: false,
                message: 'Shipping information not found. Please complete checkout first.'
            });
        }

        // Create order items array
        const orderItems = cart.items.map(item => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.productId.price
        }));

        // Calculate total amount
        const totalAmount = orderItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        // Handle payment based on method
        let paymentStatus = 'pending';
        if (paymentMethod === 'cod') {
            paymentStatus = 'pending';
        } else if (paymentMethod === 'credit-card' || paymentMethod === 'upi') {
            // For demo purposes, we'll simulate successful payment
            paymentStatus = 'paid';
        }

        // Create new order
        const order = new Order({
            orderNumber: 'ORD-' + Date.now(),
            customer: req.session.userId,
            seller: cart.items[0].productId.seller,
            items: orderItems,
            totalAmount,
            shippingAddress: {
                fullName: shippingInfo.fullName,
                email: shippingInfo.email,
                phone: shippingInfo.phone,
                street: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zipCode: shippingInfo.zipCode,
                country: shippingInfo.country
            },
            paymentMethod,
            paymentStatus,
            status: 'confirmed' // Set status to confirmed regardless of payment status
        });

        await order.save();
        console.log('Order created successfully:', order._id, 'for user:', req.session.userId);

        // Clear the cart after successful order
        cart.items = [];
        await cart.save();

        // Clear shipping info from session
        delete req.session.shippingInfo;

        res.json({
            success: true,
            message: 'Order placed successfully',
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment: ' + error.message
        });
    }
});

// Add route to update order status
router.post('/update-order-status/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId)
            .populate('customer', 'fullName email')
            .populate('seller', 'businessName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify that the order belongs to the current user or is an admin
        if (order.customer._id.toString() !== req.session.userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to order'
            });
        }

        // Update order status
        order.status = status;
        await order.save();

        // Prepare notification data
        const notificationData = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customer.fullName,
            sellerName: order.seller.businessName,
            timestamp: new Date()
        };

        // Emit socket event for real-time updates
        if (req.app.get('io')) {
            req.app.get('io').emit('orderStatusUpdate', notificationData);
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            status: order.status,
            notificationData
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status: ' + error.message
        });
    }
});

// Get order confirmation
router.get('/order-confirmation', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.query;
        
        if (!orderId) {
            // Render a user-friendly error page
            return res.status(400).render('error', { message: 'Order ID is required to view this page.' });
        }

        const order = await Order.findById(orderId)
            .populate('customer', 'fullName email phone')
            .populate('seller', 'businessName')
            .populate({
                path: 'items.product',
                select: 'name price images'
            });

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found.' });
        }

        // Verify that the order belongs to the current user
        // if (order.customer._id.toString() !== req.session.userId) {
        //     return res.status(403).render('error', { message: 'Unauthorized access to order.' });
        // }

        res.render('order-confirmation', {
            order,
            user: req.user
        });

    } catch (error) {
        console.error('Error fetching order confirmation:', error);
        res.status(500).render('error', { message: 'Failed to fetch order confirmation.' });
    }
});

// Get current user's cart (for checkout page)
router.get('/my-cart', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        res.json({
            success: true,
            cart: cart ? cart.items.map(item => ({
                id: item.productId._id,
                title: item.productId.name,
                price: item.productId.price,
                quantity: item.quantity,
                image_url: item.productId.images && item.productId.images[0]
                    ? `data:${item.productId.images[0].contentType};base64,${item.productId.images[0].data.toString('base64')}`
                    : '/images/default-product.jpg'
            })) : []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
});



// Add item to cart
router.post('/add', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity, itemType } = req.body;
        
        if (!productId || !quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID and quantity are required' 
            });
        }

        // Default to Product type if not specified
        const type = itemType || 'Product';
        console.log(`Adding item to cart: ${productId}, type: ${type}, quantity: ${quantity}`);

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            // Create new cart if it doesn't exist
            cart = new Cart({
                userId: req.session.userId,
                items: [{ productId, quantity, itemType: type }]
            });
        } else {
            // Check if product already exists in cart
            const existingItem = cart.items.find(item => 
                item.productId.toString() === productId
            );
            
            if (existingItem) {
                // Update quantity if product exists
                existingItem.quantity += quantity;
            } else {
                // Add new item if product doesn't exist
                cart.items.push({ productId, quantity, itemType: type });
            }
        }

        await cart.save();
        
        // Calculate total items in cart
        const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        
        res.json({ 
            success: true, 
            message: 'Item added to cart successfully',
            cartCount
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add item to cart: ' + error.message
        });
    }
});

// Update cart quantity
router.post('/update', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        if (!productId || !quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID and quantity are required' 
            });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found in cart' 
            });
        }

        // Update quantity
        cart.items[itemIndex].quantity = parseInt(quantity);
        await cart.save();
        
        // Calculate total items in cart
        const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        
        res.json({ 
            success: true, 
            message: 'Cart updated successfully',
            cartCount
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update cart: ' + error.message
        });
    }
});

// Remove item from cart
router.post('/remove', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID is required' 
            });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        // Remove the item from the cart
        cart.items = cart.items.filter(item => 
            item.productId.toString() !== productId
        );
        
        await cart.save();
        
        // Calculate total items in cart
        const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        
        res.json({ 
            success: true, 
            message: 'Item removed from cart successfully',
            cartCount
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove item from cart: ' + error.message
        });
    }
});

module.exports = router; 