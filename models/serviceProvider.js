const mongoose = require('mongoose');
const User = require('./user');
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
    availability: {
        type: [{
        day: { 
            type: String, 
            enum: ['mon','tue','wed','thu','fri','sat','sun'],
            required: true
        },
        hours: {
            type: String,
            match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]-(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
            required: true
        }
        }],
        default: []
    }
});

module.exports = User.discriminator('service_provider', serviceProviderSchema);