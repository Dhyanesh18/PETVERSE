const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  serviceType: { 
    type: String, 
    enum: ['walking', 'sitting', 'veterinarian', 'groomer', 'trainer', 'pet sitter', 'breeder'], 
    required: true 
  },
  description: String,
  rate: Number,
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
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

// Indexes for service queries
serviceSchema.index({ provider: 1 });
serviceSchema.index({ serviceType: 1, isApproved: 1 });
serviceSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Service', serviceSchema);