const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  username: { type: String, required: true }, // can be user._id if login is used
  service: { type: String, required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  timeSlot: { type: String, required: true }, // e.g., "10:00 AM - 11:00 AM"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
