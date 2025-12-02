const mongoose = require('mongoose');
const fileSchema = require('./fileSchema');

const lostPetSchema = new mongoose.Schema({
    petName: {
        type: String,
        required: true,
        trim: true
    },
    petType: {
        type: String,
        required: true,
        enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']
    },
    breed: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        required: true,
        trim: true
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
    lastSeenLocation: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        coordinates: {
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            }
        }
    },
    lastSeenDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    distinguishingFeatures: {
        type: String,
        trim: true
    },
    images: {
        type: [fileSchema],
        required: true,
        validate: [arrayLimit, 'Must provide between 1-5 images']
    },
    contactInfo: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        alternatePhone: String
    },
    status: {
        type: String,
        enum: ['lost', 'found', 'reunited'],
        default: 'lost'
    },
    rewardOffered: {
        type: Boolean,
        default: false
    },
    rewardAmount: {
        type: Number,
        default: 0
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

function arrayLimit(val) {
    return val.length >= 1 && val.length <= 5;
}

// Index for geospatial queries
lostPetSchema.index({ 'lastSeenLocation.coordinates': '2dsphere' });

// Index for faster queries
lostPetSchema.index({ status: 1, isActive: 1 });
lostPetSchema.index({ postedBy: 1 });
lostPetSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LostPet', lostPetSchema);
