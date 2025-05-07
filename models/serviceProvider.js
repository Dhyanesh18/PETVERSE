const mongoose = require('mongoose');
const User = require('./users');
const fileSchema = require('./fileSchema');

const serviceProviderSchema = new mongoose.Schema({
    serviceType: {
        type: String,
        required: true,
        enum: ['veterinarian', 'groomer', 'pet sitter', 'trainer', 'breeder']
    },
    serviceAddress: {
        type: String,
        required: true,
        trim: true
    },
    certificate: {
        type: fileSchema,
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    image: {
        type: fileSchema
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
    }
}, { discriminatorKey: 'role' });

module.exports = User.discriminator('service_provider', serviceProviderSchema);