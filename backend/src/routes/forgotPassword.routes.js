const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPassword');

/**
 * @swagger
 * /api/forgot-password/send-otp:
 *   post:
 *     tags: [ForgotPassword]
 *     summary: Send a one-time password (OTP) to the user's email to begin the password reset flow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Registered email address of the account
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: No account with that email exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server error sending OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Send OTP to email
router.post('/send-otp', forgotPasswordController.sendOTP);

/**
 * @swagger
 * /api/forgot-password/verify-otp:
 *   post:
 *     tags: [ForgotPassword]
 *     summary: Verify the OTP submitted by the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received via email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully – proceed to reset password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Verify OTP
router.post('/verify-otp', forgotPasswordController.verifyOTP);

/**
 * @swagger
 * /api/forgot-password/reset-password:
 *   post:
 *     tags: [ForgotPassword]
 *     summary: Set a new password after OTP verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 description: Previously verified OTP (re-validated server-side)
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid OTP or password does not meet requirements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Reset password
router.post('/reset-password', forgotPasswordController.resetPassword);

module.exports = router;
