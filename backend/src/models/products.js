const mongoose = require('mongoose');
const fileSchema = require('./fileSchema');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount:{
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    category: {
        type: String,
        required: true,
        enum: ['Pet Food', 'Toys', 'Accessories', 'Healthcare', 'Grooming']
    },
    brand: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
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
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: {
        type: [fileSchema],
        validate: [arrayLimit, 'Maximum 5 images allowed']
    },
    avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
       wishlist: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for common queries
productSchema.index({ category: 1, isApproved: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ isApproved: 1, createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text', category: 'text' });

function arrayLimit(val) {
    return val.length <= 5;
}

module.exports = mongoose.model('Product', productSchema);