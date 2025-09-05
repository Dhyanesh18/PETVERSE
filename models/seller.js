const mongoose = require('mongoose');
const User = require('./users');
const fileSchema = require('./fileSchema');

const sellerSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: 100
    },
    businessAddress: {
        type: String,
        required: [true, 'Business address is required'],
        trim: true
    },
    license: {
        type: fileSchema,
        required: [true, 'Business license is required'],
        validate: {
            validator: function(v) {
                return v.data && v.contentType;
            },
            message: 'Invalid license file format'
        }
    },
    taxId: {
        type: String,
        match: [/^[A-Za-z0-9-]+$/, 'Invalid tax ID format']
    }
});


sellerSchema.pre('save', function(next) {
    this.role = 'seller';
    next();
});

const Seller = User.discriminator('seller', sellerSchema, {
    discriminatorKey: 'role'
});


sellerSchema.methods.getBusinessInfo = function() {
    return `${this.businessName} - ${this.businessAddress}`;
};

module.exports = Seller;