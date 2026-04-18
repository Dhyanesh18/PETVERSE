const mongoose = require('mongoose');
const fileSchema = require('./fileSchema');

const petSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true, 
        enum: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] 
    },
    breed: { 
        type: String, 
        required: true 
    },
    age: { 
        type: String, 
        required: true 
    },
    gender: { 
        type: String, 
        required: true, 
        enum: ['male', 'female'] 
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true 
    },
    images: {
        type: [fileSchema],
        required: true,
        validate: [arrayLimit, 'Must provide between 1-5 images']
    },
    available: { 
        type: Boolean, 
        default: true 
    },
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
    addedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
       wishlist: {
        type: Boolean,
        default: false
    }
});

// Indexes for common queries
petSchema.index({ category: 1, isApproved: 1 });
petSchema.index({ addedBy: 1 });
petSchema.index({ isApproved: 1, createdAt: -1 });
petSchema.index({ price: 1 });
petSchema.index({ name: 'text', breed: 'text', category: 'text' });

function arrayLimit(val) {
    return val.length >= 1 && val.length <= 5;
}
module.exports = mongoose.model('Pet', petSchema);