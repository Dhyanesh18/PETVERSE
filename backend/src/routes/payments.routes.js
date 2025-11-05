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

// ------------------ Get Checkout Data (GET) ------------------
router.get('/checkout', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.productId')
            .lean();

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    cart: {
                        items: [],
                        subtotal: 0,
                        shipping: 0,
                        tax: 0,
                        total: 0
                    },
                    user: req.user
                }
            });
        }

        let subtotal = 0;
        const cartItems = [];

        cart.items.forEach(item => {
            const product = item.productId;
            if (!product) return;

            const price = product.discount > 0
                ? product.price * (1 - product.discount / 100)
                : product.price;
            
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            cartItems.push({
                _id: product._id,
                name: product.name,
                price: product.price,
                discountedPrice: price,
                discount: product.discount || 0,
                quantity: item.quantity,
                itemTotal: itemTotal.toFixed(2),
                itemType: item.itemType,
                stock: product.stock,
                images: product.images
            });
        });

        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.10;
        const total = subtotal + shipping + tax;

        res.json({
            success: true,
            data: {
                cart: {
                    items: cartItems,
                    subtotal: subtotal.toFixed(2),
                    shipping: shipping.toFixed(2),
                    tax: tax.toFixed(2),
                    total: total.toFixed(2)
                },
                user: req.user,
                shippingInfo: req.session.shippingInfo || null
            }
        });
    } catch (err) {
        console.error('Checkout data error:', err);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: err.message
        });
    }
});

// ------------------ Submit Checkout (POST) ------------------
router.post('/checkout', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, address, city, state, zipCode, phone } = req.body;

        // Validate required fields
        if (!fullName || !address || !city || !state || !zipCode || !phone) {
            return res.status(400).json({
                success: false,
                error: 'All shipping information fields are required',
                requiredFields: ['fullName', 'address', 'city', 'state', 'zipCode', 'phone']
            });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Validate stock for products
        for (const item of cart.items) {
            const productDoc = item.productId;
            if (!productDoc) continue;

            if (item.itemType === 'Product') {
                if (productDoc.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        error: `${productDoc.name} is out of stock`,
                        product: {
                            id: productDoc._id,
                            name: productDoc.name,
                            availableStock: productDoc.stock,
                            requestedQuantity: item.quantity
                        }
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
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance. Please add funds to your wallet.',
                requiredAmount: total.toFixed(2),
                currentBalance: userWallet ? userWallet.balance.toFixed(2) : '0.00',
                shortfall: userWallet ? (total - userWallet.balance).toFixed(2) : total.toFixed(2)
            });
        }

        // Store shipping info in session for payment page
        req.session.shippingInfo = { fullName, address, city, state, zipCode, phone };

        res.json({
            success: true,
            message: 'Shipping information saved',
            data: {
                redirectPath: '/payment',
                total: total.toFixed(2)
            }
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({
            success: false,
            error: 'Something went wrong. Please try again.',
            message: err.message
        });
    }
});

// ------------------ Get Wallet Balance ------------------
router.get('/wallet', isAuthenticated, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user._id });
        res.json({
            success: true,
            data: {
                wallet: wallet || { balance: 0 },
                userId: req.user._id
            }
        });
    } catch (err) {
        console.error('Wallet fetch error:', err);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: err.message
        });
    }
});

// ------------------ Get Payment Page Data ------------------
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
                    itemType: item.itemType,
                    itemTotal: itemTotal.toFixed(2)
                });
            });

            const shipping = subtotal >= 500 ? 0 : 50;
            const tax = subtotal * 0.18;
            const total = subtotal + shipping + tax;

            cartData.subtotal = subtotal.toFixed(2);
            cartData.shipping = shipping.toFixed(2);
            cartData.tax = tax.toFixed(2);
            cartData.total = total.toFixed(2);
        }

        res.json({
            success: true,
            data: {
                user: req.user,
                wallet: wallet || { balance: 0 },
                cart: cartData,
                shippingInfo: req.session.shippingInfo || null
            }
        });
    } catch (err) {
        console.error('Payment page data error:', err);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: err.message
        });
    }
});

// ------------------ Process Payment (POST) ------------------
router.post('/payment', isAuthenticated, async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Payment method is required',
                supportedMethods: ['wallet', 'upi', 'credit-card']
            });
        }

        const customerWallet = await Wallet.findOne({ user: req.user._id });
        if (!customerWallet) {
            return res.status(400).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
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

        // Validate payment method specific details
        if (paymentMethod === 'wallet') {
            if (customerWallet.balance < total) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient wallet balance',
                    requiredAmount: total.toFixed(2),
                    currentBalance: customerWallet.balance.toFixed(2),
                    shortfall: (total - customerWallet.balance).toFixed(2)
                });
            }
        } else if (paymentMethod === 'upi') {
            const { upiId } = req.body;
            const upiRegex = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
            if (!upiId || !upiRegex.test(upiId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid UPI ID format'
                });
            }
        } else if (paymentMethod === 'credit-card') {
            const { cardName, cardNumber, expiryDate, cvv } = req.body;
            const numRegex = /^\d{13,19}$/;
            const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
            const cvvRegex = /^\d{3,4}$/;
            
            if (!cardName || !numRegex.test(cardNumber?.replace(/\s+/g, '')) || 
                !expRegex.test(expiryDate) || !cvvRegex.test(cvv)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid card details'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                error: 'Unsupported payment method',
                supportedMethods: ['wallet', 'upi', 'credit-card']
            });
        }

        // Deduct stock for products
        for (const item of cart.items) {
            const productDoc = item.productId;
            if (!productDoc) continue;

            if (item.itemType === 'Product') {
                if (productDoc.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        error: `${productDoc.name} is out of stock`
                    });
                }
                productDoc.stock -= item.quantity;
                await productDoc.save();
            }
        }

        // For any purchased pets, mark them as unavailable so others cannot buy
        for (const item of cart.items) {
            if (item.itemType === 'Pet') {
                try {
                    const petDoc = await Pet.findById(item.productId._id || item.productId);
                    if (petDoc) {
                        petDoc.available = false;
                        await petDoc.save();
                    }
                } catch (e) {
                    console.error('Failed to mark pet unavailable after purchase:', e);
                }
            }
        }

        // Deduct funds from customer wallet
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

            await new Transaction({
                from: req.user._id,
                to: sellerId,
                amount: itemSellerShare
            }).save();

            // Add to order items with correct field name
            orderItems.push({
                product: item.productId._id,
                itemType: item.itemType || 'Product',
                quantity: item.quantity,
                price: item.productId.price
            });
        }

        // Add commission to admin wallet
        if (adminWallet) await adminWallet.addFunds(commission);
        await new Transaction({
            from: req.user._id,
            to: "6807e4424877bcd9980c7e00",
            amount: commission
        }).save();

        const order = new Order({
            customer: req.user._id,
            seller: primarySellerId,
            items: orderItems,
            totalAmount: total,
            status: 'completed',
            paymentStatus: 'paid',
            shippingAddress: shippingInfo,
            paymentMethod
        });
        await order.save();

        // Clear shipping info from session
        delete req.session.shippingInfo;

        // Clear cart
        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                orderId: order._id,
                totalAmount: total.toFixed(2),
                paymentMethod,
                newWalletBalance: customerWallet.balance.toFixed(2),
                redirectPath: `/order-confirmation/${order._id}`
            }
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment processing failed',
            message: error.message
        });
    }
});

// ------------------ Common Payment Page Data (Events/Service Booking) ------------------
router.get('/payment/common', isAuthenticated, async (req, res) => {
    try {
        const { type, id, amount } = req.query;

        if (!type || !id) {
            return res.status(400).json({
                success: false,
                error: 'Missing payment context',
                requiredParams: ['type', 'id']
            });
        }

        const wallet = await Wallet.findOne({ user: req.user._id });

        let item = null;
        let computedAmount = 0;
        let title = '';
        let meta = {};

        if (type === 'event') {
            const ev = await Event.findById(id).lean();
            if (!ev) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }
            item = { _id: ev._id, name: ev.title, kind: 'Event' };
            computedAmount = typeof amount !== 'undefined' ? parseFloat(amount) || 0 : (ev.entryFee || 0);
            title = 'Event Registration Payment';
            meta = { date: ev.eventDate, city: ev.location?.city };
        } else if (type === 'service') {
            const provider = await UserModel.findById(id).lean();
            if (!provider || provider.role !== 'service_provider') {
                return res.status(404).json({
                    success: false,
                    error: 'Service provider not found'
                });
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
            return res.status(400).json({
                success: false,
                error: 'Invalid payment type',
                validTypes: ['event', 'service']
            });
        }

        res.json({
            success: true,
            data: {
                user: req.user,
                wallet: wallet || { balance: 0 },
                context: { type, id },
                item,
                amount: computedAmount,
                title,
                meta
            }
        });
    } catch (err) {
        console.error('Common payment route error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to load payment page',
            message: err.message
        });
    }
});

// ------------------ Process Common Payment (POST) ------------------
router.post('/payment/common', isAuthenticated, async (req, res) => {
    try {
        const { type, id, amount, paymentMethod } = req.body;
        
        if (!type || !id || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing payment details',
                requiredFields: ['type', 'id', 'amount']
            });
        }

        if (paymentMethod && paymentMethod !== 'wallet') {
            return res.status(400).json({
                success: false,
                error: 'Only wallet method supported currently',
                supportedMethods: ['wallet']
            });
        }

        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) {
            return res.status(400).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        const charge = parseFloat(amount);
        if (Number.isNaN(charge) || charge < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        if (wallet.balance < charge) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient wallet balance',
                requiredAmount: charge.toFixed(2),
                currentBalance: wallet.balance.toFixed(2),
                shortfall: (charge - wallet.balance).toFixed(2)
            });
        }

        await wallet.deductFunds(charge);

        // Create transaction record
        await new Transaction({
            from: req.user._id,
            to: id,
            amount: charge,
            type: type === 'event' ? 'event_payment' : 'service_payment'
        }).save();

        res.json({
            success: true,
            message: 'Payment successful',
            data: {
                newBalance: wallet.balance.toFixed(2),
                amountPaid: charge.toFixed(2),
                transactionType: type,
                redirectPath: type === 'event' ? `/events/${id}/ticket` : `/bookings`
            }
        });
    } catch (err) {
        console.error('Common payment post error:', err);
        res.status(500).json({
            success: false,
            error: 'Payment failed',
            message: err.message
        });
    }
});

// ------------------ Order Confirmation Data ------------------
router.get('/order-confirmation/:orderId?', isAuthenticated, async (req, res) => {
    try {
        let orderId = req.params.orderId;
        
        if (!orderId) {
            // Get most recent order for this user
            const order = await Order.findOne({ customer: req.user._id })
                .sort({ createdAt: -1 })
                .populate('items.product', 'name price')
                .populate('seller', 'fullName email')
                .lean();
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'No orders found'
                });
            }
            orderId = order._id;
        }

        const order = await Order.findById(orderId)
            .populate('items.product', 'name price images')
            .populate('seller', 'fullName email')
            .populate('customer', 'fullName email')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if user is authorized to view this order
        if (order.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized to view this order'
            });
        }

        res.json({
            success: true,
            data: {
                order: {
                    _id: order._id,
                    orderNumber: order._id.toString().slice(-8).toUpperCase(),
                    items: order.items,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    shippingAddress: order.shippingAddress,
                    seller: order.seller,
                    customer: order.customer,
                    createdAt: order.createdAt,
                    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                }
            }
        });
    } catch (err) {
        console.error('Order confirmation error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to load order confirmation',
            message: err.message
        });
    }
});

module.exports = router;