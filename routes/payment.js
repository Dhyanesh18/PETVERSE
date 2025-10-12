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
        const total = subtotal + shipping + tax;

        res.render('checkout', {
            cart: {
                subtotal: subtotal.toFixed(2),
                shipping: shipping.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2)
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

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate stock for products
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
            }
        }

        // Calculate total for wallet validation
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
        const total = subtotal + shipping + tax;

        const userWallet = await Wallet.findOne({ user: userId });
        if (!userWallet || userWallet.balance < total) {
            return res.status(400).render('checkout', {
                cart,
                error: 'Insufficient balance. Please add funds to your wallet.'
            });
        }

        // Store shipping info in session for payment page
        req.session.shippingInfo = { fullName, address, city, state, zipCode, phone };

        res.redirect('/payment');
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).render('checkout', { cart: {}, error: 'Something went wrong. Please try again.' });
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
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.productId')
            .lean();

        let cartData = { items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 };

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
                    price,
                    quantity: item.quantity,
                    image_url: product.image_url || '/images/default-product.jpg',
                    itemType: item.itemType
                });
            });

            const shipping = subtotal >= 500 ? 0 : 50;
            const tax = subtotal * 0.18;
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


// ------------------ Payment Processing (POST) ------------------
router.post('/payment', isAuthenticated, async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        const customerWallet = await Wallet.findOne({ user: req.user._id });
        if (!customerWallet) {
            return res.status(400).json({ success: false, message: 'Wallet not found' });
        }

        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Get shipping info from session
        const shippingInfo = req.session.shippingInfo || {
            fullName: req.user.username || 'N/A',
            address: req.user.address || 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            phone: req.user.phone || 'N/A'
        };

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
        const total = subtotal + shipping + tax;

        if (customerWallet.balance < total) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        // Deduct stock for products
        for (const item of cart.items) {
            const productDoc = item.productId;
            if (!productDoc) continue;

            if (item.itemType === 'Product') {
                if (productDoc.stock < item.quantity) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `${productDoc.name} is out of stock` 
                    });
                }
                productDoc.stock -= item.quantity;
                await productDoc.save();
            }
        }

        await customerWallet.deductFunds(total);

        const adminWallet = await Wallet.findOne({ user: "6807e4424877bcd9980c7e00" });
        const commission = total * 0.05;

        // Prepare order items in the correct format for Order model
        const orderItems = [];
        let primarySellerId = null;

        for (const item of cart.items) {
            const sellerId = item.productId.seller;
            if (!primarySellerId) primarySellerId = sellerId; // Use first seller as primary

            const sellerWallet = await Wallet.findOne({ user: sellerId });
            const itemPrice = item.productId.price * item.quantity;
            const itemSellerShare = itemPrice * 0.95;
            if (sellerWallet) await sellerWallet.addFunds(itemSellerShare);

            await new Transaction({ from: req.user._id, to: sellerId, amount: itemSellerShare }).save();

            // Add to order items with correct field name
            orderItems.push({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price
            });
        }

        if (adminWallet) await adminWallet.addFunds(commission);
        await new Transaction({ from: req.user._id, to: "6807e4424877bcd9980c7e00", amount: commission }).save();

        const order = new Order({
            customer: req.user._id,
            seller: primarySellerId,
            items: orderItems,
            totalAmount: total,
            status: 'completed',
            shippingAddress: shippingInfo,
            paymentMethod
        });
        await order.save();

        // Clear shipping info from session
        delete req.session.shippingInfo;

        cart.items = [];
        await cart.save();

        res.json({ success: true, orderId: order._id, message: 'Payment processed successfully' });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, message: 'Payment processing failed' });
    }
});


// ------------------ Common Payment Page (Events/Service Booking) ------------------
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