const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true, enum: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] },
    breed: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true, enum: ['male', 'female'] },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // Path to image
    available: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to the user/seller who added the pet
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', petSchema); 