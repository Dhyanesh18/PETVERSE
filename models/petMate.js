const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const petMateSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    petType: {
        type: String,
        required: true,
        enum: ['dog', 'cat', 'bird', 'other'],
        lowercase: true
    },
    breed: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        value: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            enum: ['months', 'years']
        }
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female']
    },
    description: {
        type: String,
        required: true
    },
    location: {
        state: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        }
    },
    contact: {
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    images: [{
        data: Buffer,
        contentType: String
    }],
    registrationNumber: {
        type: String
    },
    healthChecked: {
        type: Boolean,
        default: false
    },
    termsAccepted: {
        type: Boolean,
        required: true,
        default: false
    },
    listedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add text indexes for search
petMateSchema.index({ 
    name: 'text',
    breed: 'text',
    description: 'text',
    'location.state': 'text', 
    'location.district': 'text'
});

module.exports = mongoose.model('PetMate', petMateSchema);