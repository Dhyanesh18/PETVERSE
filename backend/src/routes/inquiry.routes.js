const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const auth = require('../middleware/auth');

// Send a new inquiry/message
router.post('/send', auth, inquiryController.sendInquiry);

// Get all inquiries for the logged-in user
router.get('/list', auth, inquiryController.getInquiries);

// Get a specific inquiry by ID
router.get('/:inquiryId', auth, inquiryController.getInquiryById);

// Reply to an inquiry
router.post('/:inquiryId/reply', auth, inquiryController.replyToInquiry);

// Close an inquiry
router.patch('/:inquiryId/close', auth, inquiryController.closeInquiry);

module.exports = router;
