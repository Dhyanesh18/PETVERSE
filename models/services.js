const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., Clinic Name, Groomer Name
    category: { type: String, required: true, enum: ['Veterinary Doctor', 'Pet Grooming', 'Dog Training'] },
    description: { type: String },
    location: { type: String, required: true },
    price: { type: Number }, // Price might vary, could be optional here
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    image: { type: String }, // Path to image
    providedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to the service provider user
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema); 