const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

const crypto = require('crypto');
const Razorpay = require('razorpay');

const Cart = require('../models/cart');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const Product = require('../models/products');
const Pet = require('../models/pets');
const Order = require('../models/order');
const Transaction = require('../models/transaction');
const Event = require('../models/event');
const UserModel = require('../models/users');

function getFrontendUrl() {
    return (
        process.env.FRONTEND_URL ||
        process.env.CLIENT_URL ||
        'http://localhost:5173'
    );
}

function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        const err = new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET is not set');
        err.statusCode = 500;
        throw err;
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function toPaise(amountInRupees) {
    return Math.round(Number(amountInRupees) * 100);
}

async function creditWalletsAndLogTransactionsForOrder(order) {
    const adminUserId = process.env.ADMIN_USER_ID || '6807e4424877bcd9980c7e00';
    const adminWallet = await Wallet.findOne({ user: adminUserId });

    const commission = Number(order.totalAmount) * 0.05;

    for (const item of order.items) {
        const itemTotal = Number(item.price) * Number(item.quantity);
        const sellerShare = itemTotal * 0.95;

        let sellerId = null;
        if (item.itemType === 'Pet') {
            const petDoc = await Pet.findById(item.product).lean();
            sellerId = petDoc?.addedBy;
        } else {
            const productDoc = await Product.findById(item.product).lean();
            sellerId = productDoc?.seller;
        }

        if (!sellerId) continue;

        const sellerWallet = await Wallet.findOne({ user: sellerId });
        if (sellerWallet) await sellerWallet.addFunds(sellerShare);

        await new Transaction({
            from: order.customer,
            to: sellerId,
            amount: sellerShare,
            type: 'order_payment',
            description: `Payment for order ${order.orderNumber || order._id}`
        }).save();
    }

    if (adminWallet) await adminWallet.addFunds(commission);
    await new Transaction({
        from: order.customer,
        to: adminUserId,
        amount: commission,
        type: 'commission',
        description: `Platform commission for order ${order.orderNumber || order._id}`
    }).save();
}

async function releaseReservedInventoryForOrder(order) {
    for (const item of order.items) {
        if (item.itemType === 'Pet') {
            await Pet.findByIdAndUpdate(item.product, { $set: { available: true } });
        } else {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
    }
}

async function markOrderPaidIfNeeded(order, paymentMeta = {}) {
    if (!order) return;
    if (order.paymentStatus === 'paid') return;

    await creditWalletsAndLogTransactionsForOrder(order);

    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paymentProviderPaymentId = paymentMeta.paymentId || order.paymentProviderPaymentId;
    order.paymentProviderSignature = paymentMeta.signature || order.paymentProviderSignature;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
        status: 'processing',
        timestamp: new Date(),
        updatedBy: order.seller,
        updatedByRole: 'system',
        notes: 'Payment confirmed via Razorpay'
    });

    await order.save();
}

/**
 * @swagger
 * /api/payment/checkout:
 *   get:
 *     tags: [Payment]
 *     summary: Get checkout page data (cart items + shipping summary)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Checkout data including cart, totals, and shipping info
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
 *                     user:
 *                       type: object
 *                     shippingInfo:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/payment/checkout:
 *   post:
 *     tags: [Payment]
 *     summary: Submit shipping info and proceed to payment page
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, address, city, state, zipCode, phone]
 *             properties:
 *               fullName:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping info saved, redirect to payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing fields or empty cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        // Calculate total for reference (wallet validation will be done in payment processing)
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

/**
 * @swagger
 * /api/payment/wallet:
 *   get:
 *     tags: [Payment]
 *     summary: Get the current user's wallet balance
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
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
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                     userId:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/payment/payment:
 *   get:
 *     tags: [Payment]
 *     summary: Get payment page data (wallet balance + cart totals)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Payment page data
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
 *                     user:
 *                       type: object
 *                     wallet:
 *                       type: object
 *                     cart:
 *                       type: object
 *                     shippingInfo:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/payment:
 *   post:
 *     tags: [Payment]
 *     summary: Process order payment (wallet, UPI, card, or COD)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, upi, card, cod]
 *               upiId:
 *                 type: string
 *                 description: Required when paymentMethod is upi
 *               paymentDetails:
 *                 type: object
 *                 description: Required when paymentMethod is card
 *                 properties:
 *                   cardName:
 *                     type: string
 *                   cardNumber:
 *                     type: string
 *                   expiryDate:
 *                     type: string
 *                     example: "12/26"
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment processed, order created
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
 *                     orderId:
 *                       type: string
 *                     totalAmount:
 *                       type: string
 *                     paymentMethod:
 *                       type: string
 *                     redirectPath:
 *                       type: string
 *       400:
 *         description: Insufficient balance, invalid payment details, or empty cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// ------------------ Process Payment (POST) ------------------
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Payment method is required',
                supportedMethods: ['wallet', 'upi', 'card', 'cod']
            });
        }

        const customerWallet = await Wallet.findOne({ user: req.user._id });
        if (!customerWallet && paymentMethod === 'wallet') {
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
        } else if (paymentMethod === 'upi' || paymentMethod === 'card') {
            // Real payments are processed via Razorpay Checkout.
            // Do not collect/validate card or UPI credentials on the server.
        } else if (paymentMethod === 'cod') {
            // COD doesn't require additional validation
        } else {
            return res.status(400).json({
                success: false,
                error: 'Unsupported payment method',
                supportedMethods: ['wallet', 'upi', 'card', 'cod']
            });
        }

        // If using Razorpay, ensure configuration is present before reserving inventory.
        let razorpayClient = null;
        if (paymentMethod === 'card' || paymentMethod === 'upi') {
            razorpayClient = getRazorpayClient();
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
                        if (petDoc.available === false) {
                            return res.status(400).json({
                                success: false,
                                error: `${petDoc.name || 'This pet'} is no longer available`
                            });
                        }
                        petDoc.available = false;
                        await petDoc.save();
                    }
                } catch (e) {
                    console.error('Failed to mark pet unavailable after purchase:', e);
                }
            }
        }

        // Deduct funds from customer wallet only for wallet payments
        if (paymentMethod === 'wallet') {
            await customerWallet.deductFunds(total);
        }

        const adminWallet = await Wallet.findOne({ user: "6807e4424877bcd9980c7e00" });
        const commission = total * 0.05;

        // Prepare order items in the correct format for Order model
        const orderItems = [];
        let primarySellerId = null;

        for (const item of cart.items) {
            const doc = item.productId;
            const sellerId = item.itemType === 'Pet' ? doc.addedBy : doc.seller;
            if (!primarySellerId && sellerId) primarySellerId = sellerId; // Use first seller as primary

            const unitPrice = item.itemType === 'Product' && doc.discount > 0
                ? doc.price * (1 - doc.discount / 100)
                : doc.price;

            const sellerWallet = await Wallet.findOne({ user: sellerId });
            const itemPrice = unitPrice * item.quantity;
            const itemSellerShare = itemPrice * 0.95;

            // Only credit sellers immediately for wallet payments.
            if (paymentMethod === 'wallet') {
                if (sellerWallet) await sellerWallet.addFunds(itemSellerShare);
                await new Transaction({
                    from: req.user._id,
                    to: sellerId,
                    amount: itemSellerShare,
                    type: 'order_payment',
                    description: `Payment for order items`
                }).save();
            }

            // Add to order items with correct field name
            orderItems.push({
                product: doc._id,
                itemType: item.itemType || 'Product',
                quantity: item.quantity,
                price: unitPrice
            });
        }

        // Add commission to admin wallet only for wallet payments (real-money methods will do this after confirmation)
        if (paymentMethod === 'wallet') {
            if (adminWallet) await adminWallet.addFunds(commission);
            await new Transaction({
                from: req.user._id,
                to: "6807e4424877bcd9980c7e00",
                amount: commission,
                type: 'commission',
                description: `Platform commission for order`
            }).save();
        }

        // Razorpay flow for real-money (card/upi): create a pending order + Razorpay order and return details.
        if (paymentMethod === 'card' || paymentMethod === 'upi') {
            const currency = (process.env.RAZORPAY_CURRENCY || 'INR').toUpperCase();

            const order = new Order({
                customer: req.user._id,
                seller: primarySellerId,
                items: orderItems,
                totalAmount: total,
                status: 'pending',
                paymentStatus: 'pending',
                shippingAddress: shippingInfo,
                paymentMethod,
                paymentProvider: 'razorpay'
            });
            await order.save();

            const razorpayOrder = await razorpayClient.orders.create({
                amount: toPaise(total),
                currency,
                receipt: order.orderNumber || order._id.toString(),
                notes: {
                    orderId: order._id.toString(),
                    userId: req.user._id.toString()
                }
            });

            order.paymentProviderOrderId = razorpayOrder.id;
            await order.save();

            // Clear shipping info from session
            delete req.session.shippingInfo;

            // Clear cart (inventory already reserved)
            cart.items = [];
            await cart.save();

            return res.json({
                success: true,
                message: 'Razorpay order created',
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    paymentMethod,
                    currency,
                    amountPaise: razorpayOrder.amount,
                    razorpayOrderId: razorpayOrder.id,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    customer: {
                        name: req.user.fullName || req.user.username || 'Customer',
                        email: req.user.email,
                        contact: req.user.phone || shippingInfo.phone || ''
                    },
                    notes: {
                        orderId: order._id.toString()
                    },
                    callback: {
                        successRedirect: `${getFrontendUrl()}/order-confirmation/${order._id}`,
                        cancelRedirect: `${getFrontendUrl()}/payment?canceled=1&orderId=${order._id}`
                    }
                }
            });
        }

        const order = new Order({
            customer: req.user._id,
            seller: primarySellerId,
            items: orderItems,
            totalAmount: total,
            status: paymentMethod === 'cod' ? 'pending' : 'processing',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
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
                orderNumber: order.orderNumber,
                totalAmount: total.toFixed(2),
                paymentMethod,
                newWalletBalance: customerWallet ? customerWallet.balance.toFixed(2) : '0.00',
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

// ------------------ Razorpay: Verify Payment Signature (Realtime confirmation) ------------------
router.post('/razorpay/verify', isAuthenticated, async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing Razorpay verification fields',
                requiredFields: ['orderId', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        if (order.paymentProvider !== 'razorpay' || !order.paymentProviderOrderId) {
            return res.status(400).json({
                success: false,
                error: 'Order is not a Razorpay order'
            });
        }

        if (order.paymentProviderOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                error: 'Razorpay order ID mismatch'
            });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const expected = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expected !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment signature'
            });
        }

        await markOrderPaidIfNeeded(order, {
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });

        return res.json({
            success: true,
            message: 'Payment verified',
            data: {
                orderId: order._id,
                redirectPath: `/order-confirmation/${order._id}`
            }
        });
    } catch (err) {
        console.error('Razorpay verify error:', err);
        return res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: err.message
        });
    }
});

// ------------------ Razorpay: Cancel Pending Payment (Release inventory) ------------------
router.post('/razorpay/cancel', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.body || {};
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'orderId is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        if (order.paymentProvider !== 'razorpay') {
            return res.status(400).json({
                success: false,
                error: 'Not a Razorpay order'
            });
        }

        if (order.paymentStatus !== 'pending') {
            return res.json({
                success: true,
                message: 'Order is already finalized'
            });
        }

        await releaseReservedInventoryForOrder(order);
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();

        return res.json({
            success: true,
            message: 'Order cancelled'
        });
    } catch (err) {
        console.error('Razorpay cancel error:', err);
        return res.status(500).json({
            success: false,
            error: 'Cancel failed',
            message: err.message
        });
    }
});

// ------------------ Razorpay: Webhook (Backup realtime confirmation) ------------------
// NOTE: `src/app.js` mounts an `express.raw()` body parser for this path.
router.post('/razorpay/webhook', async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
        return res.status(500).send('RAZORPAY_WEBHOOK_SECRET is not set');
    }

    try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''));
        const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

        if (!signature || expected !== signature) {
            return res.status(400).send('Invalid webhook signature');
        }

        const payload = JSON.parse(rawBody.toString('utf8') || '{}');
        const event = payload.event;

        // Typical success event
        if (event === 'payment.captured') {
            const payment = payload?.payload?.payment?.entity;
            const razorpayOrderId = payment?.order_id;
            const razorpayPaymentId = payment?.id;

            if (razorpayOrderId) {
                const order = await Order.findOne({ paymentProvider: 'razorpay', paymentProviderOrderId: razorpayOrderId });
                if (order) {
                    await markOrderPaidIfNeeded(order, { paymentId: razorpayPaymentId });
                }
            }
        }

        // Failure events (best-effort inventory release)
        if (event === 'payment.failed') {
            const payment = payload?.payload?.payment?.entity;
            const razorpayOrderId = payment?.order_id;
            if (razorpayOrderId) {
                const order = await Order.findOne({ paymentProvider: 'razorpay', paymentProviderOrderId: razorpayOrderId });
                if (order && order.paymentStatus === 'pending') {
                    await releaseReservedInventoryForOrder(order);
                    order.paymentStatus = 'failed';
                    order.status = 'cancelled';
                    await order.save();
                }
            }
        }

        return res.json({ received: true });
    } catch (err) {
        console.error('Razorpay webhook error:', err);
        return res.status(500).json({ received: false });
    }
});

/**
 * @swagger
 * /api/payment/payment/common:
 *   get:
 *     tags: [Payment]
 *     summary: Get payment page data for event registration or service booking
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [event, service]
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event or service provider MongoDB ID
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *         description: Override amount (optional)
 *     responses:
 *       200:
 *         description: Payment page context data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing parameters or invalid type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Event or service provider not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/payment/payment/common:
 *   post:
 *     tags: [Payment]
 *     summary: Process payment for event registration or service booking (wallet only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, id, amount]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [event, service]
 *               id:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet]
 *                 default: wallet
 *     responses:
 *       200:
 *         description: Payment successful
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
 *                     newBalance:
 *                       type: string
 *                     amountPaid:
 *                       type: string
 *                     redirectPath:
 *                       type: string
 *       400:
 *         description: Insufficient balance or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        // Create transaction record with correct type
        await new Transaction({
            from: req.user._id,
            to: id,
            amount: charge,
            type: type === 'event' ? 'event_payment' : 'service_payment', // Already has type
            description: type === 'event' ? 'Event registration payment' : 'Service booking payment'
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

/**
 * @swagger
 * /api/payment/order-confirmation/{orderId}:
 *   get:
 *     tags: [Payment]
 *     summary: Get order confirmation details after successful payment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: false
 *         schema:
 *           type: string
 *         description: Order MongoDB ID (omit to get most recent order)
 *     responses:
 *       200:
 *         description: Order confirmation data
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
 *                     order:
 *                       type: object
 *       403:
 *         description: Unauthorized to view this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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