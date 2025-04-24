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
    }
}, { discriminatorKey: 'role' });

module.exports = User.discriminator('service_provider', serviceProviderSchema); 