const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/products');
const Pet = require('../models/pets');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart with full product details and totals
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart contents with subtotal, discount, and total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                         totalItems:
 *                           type: integer
 *                         subtotal:
 *                           type: string
 *                         discount:
 *                           type: string
 *                         total:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        let subtotal = 0;
        let totalDiscount = 0;
        
        const cartItems = cart.items.map(item => {
            if (!item.productId) {
                return null;
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

/**
 * @swagger
 * /api/cart/count:
 *   get:
 *     tags: [Cart]
 *     summary: Get the total item count in the current user's cart
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Total number of items in cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cartCount:
 *                       type: integer
 */
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

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Add a product or pet to the cart
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ObjectId of the product or pet
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               itemType:
 *                 type: string
 *                 enum: [Product, Pet]
 *                 default: Product
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Product or pet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        if (quantity <= 0) {
            console.log('Validation failed: Invalid quantity', quantity);
            return res.status(400).json({
                success: false,
                error: 'Quantity must be greater than 0'
            });
        }

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log('Validation failed: Invalid ObjectId format', productId);
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        const type = itemType || 'Product';
        console.log('Using item type:', type);
        
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

        if (type === 'Product' && item.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient stock available',
                availableStock: item.stock
            });
        }

        if (type === 'Product' && item.available === false) {
            console.log('Product availability check failed:', { available: item.available });
            return res.status(400).json({
                success: false,
                error: 'This product is no longer available'
            });
        }

        if (type === 'Pet' && !item.available) {
            console.log('Pet availability check failed:', { available: item.available });
            return res.status(400).json({
                success: false,
                error: 'This pet is no longer available'
            });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            cart = new Cart({
                userId: req.session.userId,
                items: [{ productId, quantity, itemType: type }]
            });
        } else {
            const existingItemIndex = cart.items.findIndex(item => 
                item.productId.toString() === productId
            );
            
            if (existingItemIndex !== -1) {
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                
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
                cart.items.push({ productId, quantity, itemType: type });
            }
        }

        await cart.save();
        
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

/**
 * @swagger
 * /api/cart/update:
 *   patch:
 *     tags: [Cart]
 *     summary: Update the quantity of an item in the cart
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Set to 0 to remove the item
 *     responses:
 *       200:
 *         description: Cart updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Negative quantity or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Cart or item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/cart/remove/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove a specific item from the cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the product to remove
 *     responses:
 *       200:
 *         description: Item removed from cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Cart or item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        cart.items.splice(itemIndex, 1);
        
        await cart.save();
        
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

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear all items from the current user's cart
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
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