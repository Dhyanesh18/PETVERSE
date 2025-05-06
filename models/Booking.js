const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  slot: { type: String, required: true }, // e.g., '10:00 AM'
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique booking per service, date, and slot
bookingSchema.index({ service: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);