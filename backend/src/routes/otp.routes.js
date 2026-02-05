const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Request OTP for login (Step 1)
router.post('/request-login-otp', otpController.requestLoginOTP);

// Verify OTP and complete login (Step 2)
router.post('/verify-login-otp', otpController.verifyLoginOTP);

// Resend OTP
router.post('/resend-otp', otpController.resendOTP);

module.exports = router;
    