const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    // Legacy: raw binary data stored in MongoDB
    data: {
        type: Buffer
    },
    contentType: {
        type: String
    },
    // Cloudinary fields
    url: {
        type: String
    },
    publicId: {
        type: String
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = fileSchema;