const OTP = require('../models/otp');
const User = require('../models/users');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');

// Request OTP for login
exports.requestLoginOTP = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if user needs approval (for sellers and service providers)
        if (['seller', 'service_provider'].includes(user.role)) {
            if (user.isApproved === false) {
                return res.status(403).json({
                    success: false,
                    error: 'Your account is pending approval. Please wait for admin verification.'
                });
            }
        }

        // Delete any existing OTPs for this email and purpose
        await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });

        // Generate new OTP
        const otp = generateOTP();

        // Save OTP to database
        await OTP.create({
            email: email.toLowerCase(),
            otp: await bcrypt.hash(otp, 10), // Hash the OTP before storing
            purpose: 'login',
            attempts: 0,
            verified: false
        });

        // Send OTP email
        await sendOTPEmail(email, otp, 'login');

        // Store temporary user data in session for OTP verification
        req.session.tempLoginData = {
            email: email.toLowerCase(),
            userId: user._id.toString(),
            role: user.role,
            timestamp: Date.now()
        };

        console.log('OTP sent successfully to:', email);
        console.log('Development OTP:', otp); // Log OTP for development

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email address',
            email: email,
            devOTP: process.env.NODE_ENV === 'development' ? otp : undefined // Send OTP in dev mode
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send OTP. Please try again.'
        });
    }
};

// Verify OTP and complete login
exports.verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Email and OTP are required'
            });
        }

        // Check session data
        if (!req.session.tempLoginData || req.session.tempLoginData.email !== email.toLowerCase()) {
            return res.status(401).json({
                success: false,
                error: 'Invalid session. Please request a new OTP.'
            });
        }

        // Check if session is still valid (10 minutes)
        const sessionAge = Date.now() - req.session.tempLoginData.timestamp;
        if (sessionAge > 10 * 60 * 1000) {
            delete req.session.tempLoginData;
            return res.status(401).json({
                success: false,
                error: 'Session expired. Please request a new OTP.'
            });
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            purpose: 'login',
            verified: false
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(401).json({
                success: false,
                error: 'OTP expired or invalid. Please request a new one.'
            });
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });
            delete req.session.tempLoginData;
            return res.status(401).json({
                success: false,
                error: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        // Verify OTP
        const otpMatch = await bcrypt.compare(otp, otpRecord.otp);
        
        if (!otpMatch) {
            // Increment attempts
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(401).json({
                success: false,
                error: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
            });
        }

        // OTP is valid - mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Get user data
        const user = await User.findById(req.session.tempLoginData.userId);
        if (!user) {
            delete req.session.tempLoginData;
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Create session
        req.session.userId = user._id;
        req.session.userRole = user.role;

        // Clean up temp login data
        delete req.session.tempLoginData;

        // Delete used OTP
        await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });

        console.log('User logged in successfully:', user.email);

        // Determine redirect path
        let redirectPath = '/';
        switch(user.role) {
            case 'owner':
                redirectPath = '/dashboard';
                break;
            case 'seller':
                redirectPath = '/seller/dashboard';
                break;
            case 'service_provider':
                redirectPath = '/service-provider/dashboard';
                break;
            case 'admin':
                redirectPath = '/admin/dashboard';
                break;
            default:
                redirectPath = '/home';
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isApproved: user.isApproved,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            redirectPath
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify OTP. Please try again.'
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;

        if (!email || !purpose) {
            return res.status(400).json({
                success: false,
                error: 'Email and purpose are required'
            });
        }

        // Check session for login purpose
        if (purpose === 'login') {
            if (!req.session.tempLoginData || req.session.tempLoginData.email !== email.toLowerCase()) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session. Please start login again.'
                });
            }
        }

        // Delete existing OTPs
        await OTP.deleteMany({ email: email.toLowerCase(), purpose });

        // Generate new OTP
        const otp = generateOTP();

        // Save new OTP
        await OTP.create({
            email: email.toLowerCase(),
            otp: await bcrypt.hash(otp, 10),
            purpose,
            attempts: 0,
            verified: false
        });

        // Send OTP email
        await sendOTPEmail(email, otp, purpose);

        // Update timestamp in session
        if (purpose === 'login' && req.session.tempLoginData) {
            req.session.tempLoginData.timestamp = Date.now();
        }

        console.log('OTP resent successfully to:', email);
        console.log('Development OTP:', otp);

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email address',
            devOTP: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend OTP. Please try again.'
        });
    }
};

module.exports = exports;
