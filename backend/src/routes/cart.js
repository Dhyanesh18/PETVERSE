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
router.post('/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Update the cart in your database
        const updatedCart = await Cart.findOneAndUpdate(
            { userId: req.user._id, "items.productId": productId },
            { $set: { "items.$.quantity": quantity } },
            { new: true }
        ).populate('items.productId');

        // Calculate the updated price for this item
        const cartItem = updatedCart.items.find(item => 
            item.productId._id.toString() === productId
        );
        
        let price = cartItem.productId.price;
        if (cartItem.itemType === 'Product' && cartItem.productId.discount > 0) {
            price = price * (1 - cartItem.productId.discount/100);
        }

        res.json({
            success: true,
            updatedPrice: price * quantity,
            cartCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (error) {
        console.error('Cart update error:', error);
        res.json({ success: false, message: 'Failed to update cart' });
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