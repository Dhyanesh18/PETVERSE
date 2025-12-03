const Wallet = require('../models/wallet');
const Order = require('../models/order');
const Cart = require('../models/cart');
const Transaction = require('../models/transaction');

exports.checkout = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user._id;

    // 1. Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 2. Deduct from wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < total) {
      throw new Error('Not enough wallet balance');
    }
    wallet.balance -= total;
    await wallet.save();

    // 3. Create order
    const order = await Order.create({
      customer: userId,
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: total,
      paymentMethod: 'wallet',
      shippingAddress,
      status: 'processing' // Auto-mark as paid
    });

    // 4. Create transaction record
    await new Transaction({
      from: userId,
      to: userId,
      amount: total,
      type: 'order_payment',
      description: `Payment for order items`
    }).save();

    // 5. Clear cart
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.json({ 
      success: true, 
      orderId: order._id,
      newBalance: wallet.balance 
    });

  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Get wallet balance (unchanged)
exports.getWalletBalance = async (req, res) => {
  const wallet = await Wallet.findOne({ user: req.user._id });
  res.json({ balance: wallet.balance || 0 });
};