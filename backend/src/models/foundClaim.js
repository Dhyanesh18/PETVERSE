const mongoose = require('mongoose');
const fileSchema = require('./fileSchema');

const foundClaimSchema = new mongoose.Schema({
    lostPetPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LostPet',
        required: true
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    claimerName: {
        type: String,
        required: true,
        trim: true
    },
    claimerPhone: {
        type: String,
        required: true
    },
    claimerEmail: {
        type: String,
        required: true
    },
    foundLocation: {
        address: {
            type: String,
            required: true
        },
        city: String,
        state: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    foundDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: [fileSchema],
        required: true,
        validate: [arrayLimit, 'Must provide between 1-3 images of the found pet']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired'],
        default: 'pending'
    },
    verificationQuestions: [{
        question: String,
        answer: String,
        isCorrect: {
            type: Boolean,
            default: null
        }
    }],
    ownerNotes: String,
    rejectionReason: String,
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
    }
}, {
    timestamps: true
});

function arrayLimit(val) {
    return val.length >= 1 && val.length <= 3;
}

// Index for faster queries
foundClaimSchema.index({ lostPetPost: 1, status: 1 });
foundClaimSchema.index({ claimedBy: 1 });
foundClaimSchema.index({ status: 1, expiresAt: 1 });

// Auto-expire old pending claims
foundClaimSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FoundClaim', foundClaimSchema);
