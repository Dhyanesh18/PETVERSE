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
        enum: ['Pet Food', 'Toys', 'Accessories']
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

function arrayLimit(val) {
    return val.length <= 5;
}

module.exports = mongoose.model('Product', productSchema);