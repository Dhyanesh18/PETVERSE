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
});

// Add item to cart
router.post('/add', isAuthenticated, async (req, res) => {
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
            // Create new cart if it doesn't exist
            cart = new Cart({
                userId: req.session.userId,
                items: [{ productId, quantity }]
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
                cart.items.push({ productId, quantity });
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
            message: 'Failed to add item to cart' 
        });
    }
});

module.exports = router; 