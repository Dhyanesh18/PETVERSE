const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/inquiry/send:
 *   post:
 *     tags: [Inquiry]
 *     summary: Send a new inquiry / chat message about a pet listing
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [petId, sellerId, message]
 *             properties:
 *               petId:
 *                 type: string
 *                 description: ObjectId of the pet the inquiry is about
 *               sellerId:
 *                 type: string
 *                 description: ObjectId of the seller/owner of the pet
 *               message:
 *                 type: string
 *                 description: Initial message text
 *     responses:
 *       200:
 *         description: Inquiry sent / message appended successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Send a new inquiry/message
router.post('/send', auth, inquiryController.sendInquiry);

/**
 * @swagger
 * /api/inquiry/list:
 *   get:
 *     tags: [Inquiry]
 *     summary: Get all inquiries for the currently logged-in user (as buyer or seller)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of inquiries with latest message info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get all inquiries for the logged-in user
router.get('/list', auth, inquiryController.getInquiries);

/**
 * @swagger
 * /api/inquiry/{inquiryId}:
 *   get:
 *     tags: [Inquiry]
 *     summary: Get a specific inquiry thread by ID including all messages
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Inquiry ObjectId
 *     responses:
 *       200:
 *         description: Inquiry thread with all messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Unauthorized – not a participant of this inquiry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Inquiry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get a specific inquiry by ID
router.get('/:inquiryId', auth, inquiryController.getInquiryById);

/**
 * @swagger
 * /api/inquiry/{inquiryId}/reply:
 *   post:
 *     tags: [Inquiry]
 *     summary: Reply to an existing inquiry thread
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Inquiry ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Reply message text
 *     responses:
 *       200:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Unauthorized – not a participant of this inquiry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Inquiry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Reply to an inquiry
router.post('/:inquiryId/reply', auth, inquiryController.replyToInquiry);

/**
 * @swagger
 * /api/inquiry/{inquiryId}/close:
 *   patch:
 *     tags: [Inquiry]
 *     summary: Close an inquiry thread (marks it as resolved / inactive)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Inquiry ObjectId
 *     responses:
 *       200:
 *         description: Inquiry closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Unauthorized – only seller or buyer can close
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Inquiry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Close an inquiry
router.patch('/:inquiryId/close', auth, inquiryController.closeInquiry);

module.exports = router;
