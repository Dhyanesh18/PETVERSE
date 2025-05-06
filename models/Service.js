const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  serviceType: { 
    type: String, 
    enum: ['walking', 'sitting'], 
    required: true 
  },
  description: String,
  rate: Number,
  availableSlots: [{
    date: Date,
    startTime: String,
    endTime: String,
    isBooked: { 
      type: Boolean, 
      default: false 
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);