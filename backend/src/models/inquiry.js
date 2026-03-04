const mongoose = require('mongoose');

const inquiryMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

const inquirySchema = new mongoose.Schema({
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
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
    messages: [inquiryMessageSchema],
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    lastMessage: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
inquirySchema.index({ customer: 1, seller: 1, petId: 1 });
inquirySchema.index({ seller: 1, status: 1 });
inquirySchema.index({ customer: 1, status: 1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
