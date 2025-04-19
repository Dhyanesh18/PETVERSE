const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Invalid email format']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    fullName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: 'Phone number must be 10 digits'
        }
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    role: {
        type: String, 
        required: true,
        enum: ['owner', 'seller', 'service_provider', 'admin'],
    },
    businessName: {
        type: String,
        required: function() {
            return this.role === 'seller';
        }
    },
    license: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files',
        required: function() {
            return this.role === 'seller';
        }
    },
    serviceType: {
        type: String,
        required: function() {
            return this.role === "service_provider";
        },
        enum: ['veterinarian', 'groomer', 'pet sitter', 'trainer', 'breeder']
    },
    certificate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files',
        required: function() {
            return this.role === "service_provider";
        }
    },
    isApproved: {
        type: Boolean,
        required: function() {
            return this.role === "service_provider" || this.role === "seller";
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    this.set({ updatedAt: Date.now() });
    if (update?.password) {
        try {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(update.password, salt);
            this.setUpdate({ ...update, password: hashedPassword });
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);