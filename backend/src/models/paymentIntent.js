const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        purpose: {
            type: String,
            enum: ['wallet_topup', 'event_entry_fee'],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        status: {
            type: String,
            enum: ['created', 'paid', 'failed', 'cancelled'],
            default: 'created'
        },
        provider: {
            type: String,
            enum: ['razorpay'],
            default: 'razorpay'
        },
        providerOrderId: {
            type: String,
            default: ''
        },
        providerPaymentId: {
            type: String,
            default: ''
        },
        providerSignature: {
            type: String,
            default: ''
        },
        metadata: {
            type: Object,
            default: {}
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
