const mongoose = require('mongoose');
const fileSchema = require('./fileSchema');

const petSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true, 
        enum: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] 
    },
    breed: { 
        type: String, 
        required: true 
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
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true 
    },
    images: {
        type: [fileSchema],
        required: true,
        validate: [arrayLimit, 'Must provide between 1-5 images']
    },
    available: { 
        type: Boolean, 
        default: true 
    },
    addedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Validation for 1-5 images
function arrayLimit(val) {
    return val.length >= 1 && val.length <= 5;
}

module.exports = mongoose.model('Pet', petSchema);