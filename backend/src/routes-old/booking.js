const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middleware/auth'); // Adjust path if needed

router.get('/:serviceId', isAuthenticated, bookingController.getBookingPage);
router.get('/available/slots', isAuthenticated, bookingController.getAvailableSlots);
router.post('/', isAuthenticated, bookingController.bookSlot);

module.exports = router;