const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required'],
    default: null 
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
      refPath: 'items.itemType',
      required: true
    },
    itemType: {
      type: String,
      enum: ['Product', 'Pet'],
      default: 'Product'
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
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'card', 'upi', 'wallet'],
    default: 'cod'
  },
  shippingAddress: {
    type: Object,
    required: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedByRole: {
      type: String,
      enum: ['seller', 'admin', 'system'],
      default: 'seller'
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


orderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

// Update timestamps on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update lastStatusUpdate if status changed
  if (this.isModified('status')) {
    this.lastStatusUpdate = Date.now();
  }
  
  next();
});

// Initialize status history when order is first created
orderSchema.pre('save', function(next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.status || 'pending',
      timestamp: new Date(),
      updatedBy: this.seller,
      updatedByRole: 'system',
      notes: 'Order created'
    }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);