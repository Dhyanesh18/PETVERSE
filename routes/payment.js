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
const Event = require('../models/event');
const UserModel = require('../models/users');


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
        const tax = subtotal * 0.18; // 18% GST

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

        // First, get the cart with basic population
        let cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Populate seller/addedBy based on item type
        for (const item of cart.items) {
            if (item.productId) {
                if (item.itemType === 'Product') {
                    await item.productId.populate('seller');
                } else if (item.itemType === 'Pet') {
                    await item.productId.populate('addedBy');
                }
            }
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const productDoc = item.productId;
            if (!productDoc) continue;

            // Check stock for products
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

        // Check balance before creating order
        const userWallet = await Wallet.findOne({ user: userId });
        if (!userWallet || userWallet.balance < totalAmount) {
            return res.status(400).render('checkout', {
                cart,
                error: 'Insufficient balance. Please add funds to your wallet.'
            });
        }

        // Get the seller ID based on item type
        const firstItem = cart.items[0];
        const sellerId = firstItem.itemType === 'Product' 
            ? firstItem.productId.seller 
            : firstItem.productId.addedBy;

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

        // Deduct & distribute funds
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

        // Try to safely get user's cart to re-render page
        let cart = { subtotal: 0, shipping: 0, tax: 0, total: 0 };

        try {
            const existingCart = await Cart.findOne({ userId: req.user._id }).populate('items.productId').lean();
            if (existingCart && existingCart.items.length > 0) {
                let subtotal = 0;
                existingCart.items.forEach(item => {
                    const product = item.productId;
                    if (!product) return;
                    const price = product.discount > 0
                        ? product.price * (1 - product.discount / 100)
                        : product.price;
                    subtotal += price * item.quantity;
                });
                const shipping = subtotal >= 500 ? 0 : 50;
                const tax = subtotal * 0.18; // 18% GST
                cart = {
                    subtotal: subtotal.toFixed(2),
                    shipping: shipping.toFixed(2),
                    tax: tax.toFixed(2),
                    total: (subtotal + shipping + tax).toFixed(2)
                };
            }
        } catch (innerErr) {
            console.error('Failed to recalculate cart:', innerErr);
        }

        res.status(500).render('checkout', { cart, error: 'Something went wrong. Please try again.' });
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
        
        // Get cart data with populated products
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.productId')
            .lean();

        let cartData = {
            items: [],
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0
        };

        if (cart && cart.items.length > 0) {
            let subtotal = 0;
            cart.items.forEach(item => {
                const product = item.productId;
                if (!product) return;

                const price = product.discount > 0
                    ? product.price * (1 - product.discount / 100)
                    : product.price;

                const itemTotal = price * item.quantity;
                subtotal += itemTotal;

                cartData.items.push({
                    _id: product._id,
                    name: product.name,
                    price: price,
                    quantity: item.quantity,
                    image_url: product.image_url || '/images/default-product.jpg',
                    itemType: item.itemType
                });
            });

            const shipping = subtotal >= 500 ? 0 : 50;
            const tax = subtotal * 0.18; // 18% GST
            const total = subtotal + shipping + tax;

            cartData.subtotal = subtotal;
            cartData.shipping = shipping;
            cartData.tax = tax;
            cartData.total = total;
        }

        res.render('payment', {
            user: req.user,
            wallet: wallet || { balance: 0 },
            cart: cartData
        });
    } catch (err) {
        console.error('Payment route error:', err);
        res.status(500).send('Server Error');
    }
});


// ------------------ Common Payment Page (Events/Service Booking) ------------------
// GET /payment/common?type=event|service&id=<id>&amount=<optional override>
router.get('/payment/common', isAuthenticated, async (req, res) => {
    try {
        const { type, id, amount } = req.query;

        if (!type || !id) {
            return res.status(400).render('error', { message: 'Missing payment context' });
        }

        const wallet = await Wallet.findOne({ user: req.user._id });

        let item = null;
        let computedAmount = 0;
        let title = '';
        let meta = {};

        if (type === 'event') {
            const ev = await Event.findById(id).lean();
            if (!ev) return res.status(404).render('error', { message: 'Event not found' });
            item = { _id: ev._id, name: ev.title, kind: 'Event' };
            computedAmount = typeof amount !== 'undefined' ? parseFloat(amount) || 0 : (ev.entryFee || 0);
            title = 'Event Registration Payment';
            meta = { date: ev.eventDate, city: ev.location?.city };
        } else if (type === 'service') {
            // Service booking: compute price similarly to services listing (based on provider's serviceType)
            const provider = await UserModel.findById(id).lean();
            if (!provider || provider.role !== 'service_provider') {
                return res.status(404).render('error', { message: 'Service provider not found' });
            }
            const mapPrice = (serviceType) => {
                if (serviceType === 'veterinarian' || serviceType === 'trainer') return 500;
                if (serviceType === 'groomer') return 300;
                if (serviceType === 'walking' || serviceType === 'sitting' || serviceType === 'pet sitter') return 200;
                if (serviceType === 'breeder') return 200;
                return 400;
            };
            item = { _id: provider._id, name: provider.fullName || 'Service Booking', kind: 'Service Booking' };
            computedAmount = typeof amount !== 'undefined' ? parseFloat(amount) || 0 : mapPrice(provider.serviceType);
            title = 'Service Booking Payment';
            meta = { serviceType: provider.serviceType, city: provider.serviceAddress };
        } else {
            return res.status(400).render('error', { message: 'Invalid payment type' });
        }

        res.render('payment-common', {
            user: req.user,
            wallet: wallet || { balance: 0 },
            context: { type, id },
            item,
            amount: computedAmount,
            title,
            meta
        });
    } catch (err) {
        console.error('Common payment route error:', err);
        res.status(500).render('error', { message: 'Failed to load payment page' });
    }
});

// POST /payment/common — deduct wallet for single-item flows (event/service)
router.post('/payment/common', isAuthenticated, async (req, res) => {
    try {
        const { type, id, amount, paymentMethod } = req.body;
        if (!type || !id || !amount) {
            return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        if (paymentMethod && paymentMethod !== 'wallet') {
            return res.status(400).json({ success: false, message: 'Only wallet method supported currently' });
        }

        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found' });

        const charge = parseFloat(amount);
        if (Number.isNaN(charge) || charge < 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        if (wallet.balance < charge) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        await wallet.deductFunds(charge);

        return res.json({ success: true, newBalance: wallet.balance });
    } catch (err) {
        console.error('Common payment post error:', err);
        res.status(500).json({ success: false, message: 'Payment failed' });
    }
});


// ------------------ Order Confirmation ------------------
router.get('/order-confirmation', async (req, res) => {
    const order = await Order.find().sort({ createdAt: -1 }).limit(1);
    res.render('order-confirmation', { orderId: order.length ? order[0]._id : null });
});

module.exports = router;