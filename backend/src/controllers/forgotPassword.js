const User = require('../models/users');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

module.exports = {
    // Step 1: Send OTP to user's email
    sendOTP: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                // Don't reveal if user exists or not for security
                return res.status(200).json({
                    success: true,
                    message: 'If an account exists with this email, an OTP has been sent'
                });
            }

            // Generate OTP
            const otp = generateOTP();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Save OTP to user document
            user.resetPasswordOTP = otp;
            user.resetPasswordOTPExpires = otpExpires;
            await user.save();

            // Send OTP via email
            const emailResult = await sendOTPEmail(email, otp, 'password_reset');
            if (!emailResult?.success && process.env.NODE_ENV !== 'development') {
                // Avoid account enumeration: keep response generic
                console.error('Failed to deliver password reset OTP email:', emailResult?.error);
            }

            return res.status(200).json({
                success: true,
                message: 'OTP has been sent to your email',
                devOTP: process.env.NODE_ENV === 'development' ? otp : undefined,
                emailDelivery: process.env.NODE_ENV === 'development' ? (emailResult?.delivered || (emailResult?.success ? 'smtp' : 'failed')) : undefined,
                emailError: process.env.NODE_ENV === 'development' && !emailResult?.success ? emailResult?.error : undefined
            });

        } catch (error) {
            console.error('Send OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send OTP. Please try again.'
            });
        }
    },

    // Step 2: Verify OTP
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and OTP are required'
                });
            }

            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid OTP or email'
                });
            }

            // Check if OTP exists and is not expired
            if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
                return res.status(400).json({
                    success: false,
                    error: 'No OTP request found. Please request a new OTP'
                });
            }

            // Check if OTP is expired
            if (new Date() > user.resetPasswordOTPExpires) {
                // Clear expired OTP
                user.resetPasswordOTP = null;
                user.resetPasswordOTPExpires = null;
                await user.save();

                return res.status(400).json({
                    success: false,
                    error: 'OTP has expired. Please request a new one'
                });
            }

            // Verify OTP
            if (user.resetPasswordOTP !== otp) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid OTP'
                });
            }

            // OTP is valid
            return res.status(200).json({
                success: true,
                message: 'OTP verified successfully'
            });

        } catch (error) {
            console.error('Verify OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify OTP. Please try again.'
            });
        }
    },

    // Step 3: Reset password after OTP verification
    resetPassword: async (req, res) => {
        try {
            const { email, otp, newPassword } = req.body;

            if (!email || !otp || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Email, OTP, and new password are required'
                });
            }

            // Validate password strength
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 8 characters long'
                });
            }

            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request'
                });
            }

            // Verify OTP one more time
            if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid OTP found. Please request a new OTP'
                });
            }

            if (new Date() > user.resetPasswordOTPExpires) {
                user.resetPasswordOTP = null;
                user.resetPasswordOTPExpires = null;
                await user.save();

                return res.status(400).json({
                    success: false,
                    error: 'OTP has expired. Please request a new one'
                });
            }

            if (user.resetPasswordOTP !== otp) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid OTP'
                });
            }

            // Update password and clear OTP
            user.password = newPassword;
            user.resetPasswordOTP = null;
            user.resetPasswordOTPExpires = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Password reset successfully. You can now login with your new password'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to reset password. Please try again.'
            });
        }
    }
};
