const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    provider: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: String,
        required: true // e.g., "1 hour", "30 minutes"
    },
    image: {
        type: Schema.Types.Mixed // Assuming fileSchema-like structure: { data: Buffer, contentType: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);