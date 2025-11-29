const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  from: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  type: {
    type: String,
    enum: ['add_money', 'order_payment', 'refund', 'user_cancellation_refund', 'admin_refund', 'commission', 'event_payment', 'service_payment'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);