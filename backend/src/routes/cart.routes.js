const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/products');
const Pet = require('../models/pets');
const { isAuthenticated } = require('../middleware/auth');

// Get cart with full details
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                select: 'name price discount images category stock seller'
            });
        
        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    cart: {
                        items: [],
                        totalItems: 0,
                        subtotal: 0,
                        discount: 0,
                        total: 0
                    }
                }
            });
        }

        // Calculate cart totals
        let subtotal = 0;
        let totalDiscount = 0;
        
        const cartItems = cart.items.map(item => {
            if (!item.productId) {
                return null; // Handle deleted products
            }

            let price = item.productId.price;
            let itemDiscount = 0;
            
            if (item.itemType === 'Product' && item.productId.discount > 0) {
                itemDiscount = price * (item.productId.discount / 100);
                price = price - itemDiscount;
            }
            
            const itemTotal = price * item.quantity;
            subtotal += item.productId.price * item.quantity;
            totalDiscount += itemDiscount * item.quantity;
            
            return {
                _id: item._id,
                productId: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                discountedPrice: price,
                discount: item.productId.discount || 0,
                images: item.productId.images,
                category: item.productId.category,
                stock: item.productId.stock,
                seller: item.productId.seller,
                quantity: item.quantity,
                itemType: item.itemType,
                itemTotal
            };
        }).filter(item => item !== null);

        const total = subtotal - totalDiscount;
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: {
                cart: {
                    _id: cart._id,
                    items: cartItems,
                    totalItems,
                    subtotal: subtotal.toFixed(2),
                    discount: totalDiscount.toFixed(2),
                    total: total.toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get cart',
            message: error.message 
        });
    }
});

// Get cart count only
router.get('/count', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        const cartCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
        
        res.json({ 
            success: true, 
            data: {
                cartCount 
            }
        });
    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get cart count',
            message: error.message 
        });
    }
});

// Add item to cart
router.post('/add', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity, itemType } = req.body;
        
        console.log('Cart add request received:', {
            productId,
            quantity,
            itemType,
            userId: req.session.userId,
            body: req.body
        });
        
        if (!productId || !quantity) {
            console.log('Validation failed: Missing productId or quantity');
            return res.status(400).json({ 
                success: false, 
                error: 'Product ID and quantity are required' 
            });
        }

        // Validate quantity
        if (quantity <= 0) {
            console.log('Validation failed: Invalid quantity', quantity);
            return res.status(400).json({
                success: false,
                error: 'Quantity must be greater than 0'
            });
        }

        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log('Validation failed: Invalid ObjectId format', productId);
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        // Default to Product type if not specified
        const type = itemType || 'Product';
        console.log('Using item type:', type);
        
        // Verify the product exists and has enough stock
        let item;
        if (type === 'Product') {
            item = await Product.findById(productId);
        } else if (type === 'Pet') {
            item = await Pet.findById(productId);
        }
        
        if (!item) {
            return res.status(404).json({
                success: false,
                error: `${type} not found`
            });
        }

        // Check stock availability (for products)
        if (type === 'Product' && item.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient stock available',
                availableStock: item.stock
            });
        }

        // Check product availability flag (mirror pet availability check)
        if (type === 'Product' && item.available === false) {
            console.log('Product availability check failed:', { available: item.available });
            return res.status(400).json({
                success: false,
                error: 'This product is no longer available'
            });
        }

        // Check if pet is available
        if (type === 'Pet' && !item.available) {
            console.log('Pet availability check failed:', { available: item.available });
            return res.status(400).json({
                success: false,
                error: 'This pet is no longer available'
            });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            // Create new cart if it doesn't exist
            cart = new Cart({
                userId: req.session.userId,
                items: [{ productId, quantity, itemType: type }]
            });
        } else {
            // Check if product already exists in cart
            const existingItemIndex = cart.items.findIndex(item => 
                item.productId.toString() === productId
            );
            
            if (existingItemIndex !== -1) {
                // Update quantity if product exists
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                
                // Check stock for new quantity (for products)
                if (type === 'Product' && item.stock < newQuantity) {
                    return res.status(400).json({
                        success: false,
                        error: 'Cannot add more items. Insufficient stock.',
                        availableStock: item.stock,
                        currentInCart: cart.items[existingItemIndex].quantity
                    });
                }
                
                cart.items[existingItemIndex].quantity = newQuantity;
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
            message: `${type} added to cart successfully`,
            data: {
                cartCount,
                itemAdded: {
                    productId,
                    name: item.name,
                    quantity,
                    itemType: type
                }
            }
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add item to cart',
            message: error.message
        });
    }
});

// Update cart item quantity
router.patch('/update', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        if (!productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Product ID and quantity are required'
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity cannot be negative'
            });
        }

        // If quantity is 0, remove the item
        if (quantity === 0) {
            return router.handle({ 
                method: 'POST', 
                url: '/remove', 
                body: { productId } 
            }, req, res);
        }

        const cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const cartItem = cart.items.find(item => 
            item.productId.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        // Check stock availability
        if (cartItem.itemType === 'Product') {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            
            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient stock available',
                    availableStock: product.stock
                });
            }
        }

        // Update the cart
        const updatedCart = await Cart.findOneAndUpdate(
            { userId: req.session.userId, "items.productId": productId },
            { $set: { "items.$.quantity": quantity } },
            { new: true }
        ).populate('items.productId');

        if (!updatedCart) {
            return res.status(500).json({
                success: false,
                error: 'Failed to update cart'
            });
        }

        // Calculate the updated price for this item
        const updatedItem = updatedCart.items.find(item => 
            item.productId._id.toString() === productId
        );
        
        let price = updatedItem.productId.price;
        if (updatedItem.itemType === 'Product' && updatedItem.productId.discount > 0) {
            price = price * (1 - updatedItem.productId.discount/100);
        }

        const cartCount = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            message: 'Cart updated successfully',
            data: {
                itemTotal: (price * quantity).toFixed(2),
                cartCount,
                updatedQuantity: quantity
            }
        });
    } catch (error) {
        console.error('Cart update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update cart',
            message: error.message 
        });
    }
});

// Remove item from cart
router.delete('/remove/:productId', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Product ID is required' 
            });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                error: 'Cart not found' 
            });
        }

        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        // Remove the item from the cart
        cart.items.splice(itemIndex, 1);
        
        await cart.save();
        
        // Calculate total items in cart
        const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        
        res.json({ 
            success: true, 
            message: 'Item removed from cart successfully',
            data: {
                cartCount
            }
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to remove item from cart',
            message: error.message
        });
    }
});

// Clear entire cart
router.delete('/clear', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.json({
                success: true,
                message: 'Cart is already empty'
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                cartCount: 0
            }
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart',
            message: error.message
        });
    }
});

module.exports = router;