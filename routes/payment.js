// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');
const attachWallet = require('../middleware/attachWallet');
const Cart = require('../models/cart');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const Seller = require('../models/seller');
const Product = require('../models/products');
const Order = require('../models/order');
const Transaction = require("../models/transaction");
// Render checkout page with wallet data
// In your route handler (before rendering checkout.ejs)
router.get('/checkout', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
                            .populate('items.productId')
                            .lean();
        
        // Calculate totals
        let subtotal = 0;
        cart.items.forEach(item => {
            const price = item.productId.discount > 0 ?
                item.productId.price * (1 - item.productId.discount/100) :
                item.productId.price;
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

// Process payment
router.post('/checkout', isAuthenticated, async (req, res)=>{
    try {
        const { 
        fullName, address, city, state, zipCode, phone,
        subtotal, shipping, tax, total 
        } = req.body;

        const cart = await Cart.findOne({userId: req.session.userId})
        .populate({
            path: 'items.productId',
            model: 'Product',
            populate: {
                path: 'seller',
                model: 'User'
            }
        });

        const sellerId = cart.items[0].productId.seller._id;
        const seller = await User.findById(sellerId);

        const stockErrors = [];
        for (const item of cart.items) {
            if (item.productId.stock < item.quantity) {
            stockErrors.push({
                product: item.productId.name,
                available: item.productId.stock,
                requested: item.quantity
            });
            }
        }
    
        if (stockErrors.length > 0) {
            return res.status(400).json({
            error: "Insufficient stock",
            details: stockErrors
            });
        }

        const orderItems = cart.items.map(item => ({
            product: item.productId._id, 
            quantity: item.quantity,
            price: item.productId.price 
        }));

        const order = new Order({
            customer: req.session.userId,
            seller: sellerId,
            items: orderItems,
            totalAmount: total,
            shippingAddress: address,
            status: "processing"
        });

        await order.save();

        const bulkUpdateOps = cart.items.map(item => ({
        updateOne: {
            filter: { _id: item.productId._id },
            update: { $inc: { stock: -item.quantity } }
        }
        }));

        await Product.bulkWrite(bulkUpdateOps);
        console.log("Stocks updated successfully");
        console.log("Order created successfully");
        
        cart.items = [];
        cart.updatedAt = Date.now();
        await cart.save();
        console.log("Cart emptied successfully");

        const wallet = await Wallet.findOne({user: req.session.userId});
        const balance = wallet.balance;

        const commission = total*0.05;
        const sellerRevenue = total - commission;

        
        const userWallet = await Wallet.findOne({user: req.session.userId});
        const sellerWallet = await Wallet.findOne({user: sellerId});
        const adminWallet = await Wallet.findOne({user: "6807e4424877bcd9980c7e00"});

        
        userWallet.deductFunds(total);
        sellerWallet.addFunds(sellerRevenue);
        const userToSeller = new Transaction({
            from: req.session.userId,
            to: sellerId,
            amount: sellerRevenue
        });
        await userToSeller.save();
        console.log("Transaction completed: User to Seller");
        adminWallet.addFunds(commission);

        const userToAdmin = new Transaction({
            from: req.session.userId,
            to: "6807e4424877bcd9980c7e00",
            amount: commission
        });
        await userToAdmin.save();
        console.log("Transaction completed: User to Admin");
        res.redirect('/payment');
    }
    catch (err){
        console.error('Checkout error:', err);
        res.status(500).send('Server Error');
    }
});

// Wallet balance endpoint
router.get('/wallet', isAuthenticated, paymentController.getWalletBalance);

// Render payment page
router.get('/payment', isAuthenticated, async (req, res) => {
    try {
        // Get wallet for the logged-in user
        const wallet = await Wallet.findOne({ user: req.user._id });
        
        // If no wallet found, create a default one
        const walletData = wallet || { balance: 0 };

        res.render('payment', {
            user: req.user,
            wallet: walletData
        });

    } catch (err) {
        console.error('Payment route error:', err);
        res.status(500).send('Server Error');
    }
});

router.get('/order-confirmation', async (req,res)=>{
    const order = await Order.find().sort({createdAt: -1}).limit(1);
    const orderId = order._id;
    res.render('order-confirmation', {orderId : orderId});
});

module.exports = router;