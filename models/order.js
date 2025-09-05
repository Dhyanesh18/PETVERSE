// models/order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required'],
    default: null // Temporary default to pass initial validation
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  shippingAddress: {
    type: Object,
    required: true
  },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate order number before saving
orderSchema.pre('validate', async function(next) {  // Change from 'save' to 'validate'
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);