const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPassword');

// Send OTP to email
router.post('/send-otp', forgotPasswordController.sendOTP);

// Verify OTP
router.post('/verify-otp', forgotPasswordController.verifyOTP);

// Reset password
router.post('/reset-password', forgotPasswordController.resetPassword);

module.exports = router;
