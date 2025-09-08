// routes/payment.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

const Cart = require('../models/cart');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const Product = require('../models/products');
const Pet = require('../models/pets');
const Order = require('../models/order');
const Transaction = require('../models/transaction');


// ------------------ Checkout Page (GET) ------------------
router.get('/checkout', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
        .populate('items.productId')
        .lean();

        if (!cart || cart.items.length === 0) {
        return res.render('checkout', {
            cart: { subtotal: 0, shipping: 0, tax: 0, total: 0 }
        });
        }

        // Calculate totals
        let subtotal = 0;
        cart.items.forEach(item => {
        const product = item.productId;
        if (!product) return;

        const price = product.discount > 0
            ? product.price * (1 - product.discount / 100)
            : product.price;

        subtotal += price * item.quantity;
        });

        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.10;

        res.render('checkout', {
        cart: {
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: (subtotal + shipping + tax).toFixed(2)
        }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
    });


    // ------------------ Checkout (POST) ------------------
    router.post('/checkout', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, address, city, state, zipCode, phone } = req.body;

        let cart = await Cart.findOne({ userId })
        .populate({
            path: 'items.productId',
            populate: { path: 'addedBy', model: 'User' }
        });

        if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
        const productDoc = item.productId;
        if (!productDoc) continue;

        if (item.itemType === 'Product') {
            if (productDoc.stock < item.quantity) {
            return res.status(400).render('checkout', {
                cart,
                error: `${productDoc.name} is out of stock`
            });
            }
            productDoc.stock -= item.quantity;
            await productDoc.save();
        }

        const price = productDoc.price * item.quantity;
        totalAmount += price;

        orderItems.push({
            product: productDoc._id,
            quantity: item.quantity,
            price: productDoc.price
        });
        }

        //Check balance before creating order
        const userWallet = await Wallet.findOne({ user: userId });
        if (!userWallet || userWallet.balance < totalAmount) {
        return res.status(400).render('checkout', {
            cart,
            error: 'Insufficient balance. Please add funds to your wallet.'
        });
        }

        const sellerId = cart.items[0].productId.addedBy;

        const order = new Order({
        customer: userId,
        seller: sellerId,
        items: orderItems,
        totalAmount,
        shippingAddress: { fullName, address, city, state, zipCode, phone },
        status: 'processing'
        });

        await order.save();

        // Clear cart
        cart.items = [];
        cart.updatedAt = Date.now();
        await cart.save();

        // Deduct & distribute
        const sellerWallet = await Wallet.findOne({ user: sellerId });
        const adminWallet = await Wallet.findOne({ user: "6807e4424877bcd9980c7e00" });

        const commission = totalAmount * 0.05;
        const sellerRevenue = totalAmount - commission;

        await userWallet.deductFunds(totalAmount);
        if (sellerWallet) await sellerWallet.addFunds(sellerRevenue);
        if (adminWallet) await adminWallet.addFunds(commission);

        await new Transaction({ from: userId, to: sellerId, amount: sellerRevenue }).save();
        await new Transaction({ from: userId, to: "6807e4424877bcd9980c7e00", amount: commission }).save();

        res.redirect('/payment');
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).render('checkout', { error: 'Something went wrong. Please try again.' });
    }
    });



    // ------------------ Wallet Balance ------------------
    router.get('/wallet', isAuthenticated, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user._id });
        res.json(wallet || { balance: 0 });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
    });


    // ------------------ Payment Page ------------------
    router.get('/payment', isAuthenticated, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user._id });
        res.render('payment', {
        user: req.user,
        wallet: wallet || { balance: 0 }
        });
    } catch (err) {
        console.error('Payment route error:', err);
        res.status(500).send('Server Error');
    }
    });


    // ------------------ Order Confirmation ------------------
    router.get('/order-confirmation', async (req, res) => {
    const order = await Order.find().sort({ createdAt: -1 }).limit(1);
    res.render('order-confirmation', { orderId: order.length ? order[0]._id : null });
    });

module.exports = router;
