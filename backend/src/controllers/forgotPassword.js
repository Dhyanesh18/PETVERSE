const User = require('../models/users');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper function to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP via email
const sendOTPEmail = async (email, otp) => {
    // Check if email configuration is available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        try {
            // Create transporter with Gmail or other email service
            const transporter = nodemailer.createTransport({
                service: 'gmail', // You can change this to other services
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset OTP - PetVerse',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #FF6B35;">Password Reset Request</h2>
                        <p>Hello,</p>
                        <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
                        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <h1 style="color: #FF6B35; letter-spacing: 8px; margin: 0;">${otp}</h1>
                        </div>
                        <p><strong>This OTP will expire in 10 minutes.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px;">This is an automated message from PetVerse. Please do not reply to this email.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`OTP email sent successfully to ${email}`);
        } catch (error) {
            console.error('Error sending email:', error);
            // Fallback to console logging if email fails
            console.log(`\n=================================`);
            console.log(`OTP for ${email}: ${otp}`);
            console.log(`This OTP will expire in 10 minutes`);
            console.log(`=================================\n`);
        }
    } else {
        // For development without email configuration, log to console
        console.log(`\n=================================`);
        console.log(`OTP for ${email}: ${otp}`);
        console.log(`This OTP will expire in 10 minutes`);
        console.log(`(Configure EMAIL_USER and EMAIL_PASSWORD in .env to send actual emails)`);
        console.log(`=================================\n`);
    }
};

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
            await sendOTPEmail(email, otp);

            return res.status(200).json({
                success: true,
                message: 'OTP has been sent to your email'
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
