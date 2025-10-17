const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 
            message: 'Invalid email format'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: v => /^\d{10}$/.test(v),
            message: 'Phone must be 10 digits'
        }
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ['owner', 'seller', 'service_provider', 'admin']
    },
    isApproved: {
        type: Boolean,
        required: function() {
            return ['seller', 'service_provider'].includes(this.role);
        }
    },
        wishlistProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    wishlistPets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }]

}, { 
    timestamps: true 
});

// Password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

// Password comparison
userSchema.methods.comparePassword = async function(inputPassword) {
    try {
        return await bcrypt.compare(inputPassword, this.password);
    } catch (err) {
        console.error(err);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);