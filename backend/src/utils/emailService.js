const nodemailer = require('nodemailer');

const getEmailDeliveryMode = () => {
    // smtp: send via nodemailer transporter
    // console: log email payload to console (useful for local testing)
    return (process.env.EMAIL_DELIVERY || 'smtp').toLowerCase();
};

const shouldLogOtp = () => {
    return process.env.EMAIL_LOG_OTP === 'true' || process.env.NODE_ENV === 'development';
};

// Create transporter with detailed configuration
const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
        throw new Error('Missing EMAIL_USER/EMAIL_PASSWORD for SMTP delivery');
    }

    // Prefer service-based config for Gmail; it works well with App Passwords.
    const emailService = (process.env.EMAIL_SERVICE || '').toLowerCase();
    const looksLikeGmail = user.toLowerCase().endsWith('@gmail.com');
    if (emailService === 'gmail' || looksLikeGmail) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });
    }

    // Generic SMTP config (can be overridden via env)
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure = String(process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'login') => {
    try {
        const deliveryMode = getEmailDeliveryMode();

        // Different email templates based on purpose
        let subject, html;

        switch (purpose) {
            case 'login':
                subject = 'PetVerse - Your Login OTP';
                html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 30px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 30px; }
                            .logo { font-size: 32px; font-weight: bold; color: #0d9488; }
                            .otp-box { background: linear-gradient(135deg, #0d9488 0%, #134e4a 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
                            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
                            .content { color: #333; line-height: 1.6; }
                            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🐾 PetVerse</div>
                            </div>
                            <div class="content">
                                <h2 style="color: #0d9488;">Login Verification Code</h2>
                                <p>Hello,</p>
                                <p>You are attempting to log in to your PetVerse account. Please use the following One-Time Password (OTP) to complete your login:</p>
                                <div class="otp-box">
                                    <div>Your OTP is:</div>
                                    <div class="otp-code">${otp}</div>
                                    <div style="font-size: 14px; margin-top: 10px;">Valid for 10 minutes</div>
                                </div>
                                <div class="warning">
                                    <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. PetVerse staff will never ask for your OTP.
                                </div>
                                <p>If you did not attempt to log in, please ignore this email or contact our support team immediately.</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated email. Please do not reply.</p>
                                <p>&copy; 2025 PetVerse. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
                break;

            case 'password_reset':
            case 'forgot_password':
                subject = 'PetVerse - Password Reset OTP';
                html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 30px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 30px; }
                            .logo { font-size: 32px; font-weight: bold; color: #0d9488; }
                            .otp-box { background: linear-gradient(135deg, #0d9488 0%, #134e4a 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
                            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
                            .content { color: #333; line-height: 1.6; }
                            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🐾 PetVerse</div>
                            </div>
                            <div class="content">
                                <h2 style="color: #0d9488;">Password Reset Code</h2>
                                <p>Hello,</p>
                                <p>We received a request to reset your PetVerse account password. Use the OTP below to continue:</p>
                                <div class="otp-box">
                                    <div>Your OTP is:</div>
                                    <div class="otp-code">${otp}</div>
                                    <div style="font-size: 14px; margin-top: 10px;">Valid for 10 minutes</div>
                                </div>
                                <div class="warning">
                                    <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone.
                                </div>
                                <p>If you did not request a password reset, you can ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated email. Please do not reply.</p>
                                <p>&copy; 2025 PetVerse. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
                break;

            case 'signup':
                subject = 'PetVerse - Verify Your Email';
                html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 30px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 30px; }
                            .logo { font-size: 32px; font-weight: bold; color: #0d9488; }
                            .otp-box { background: linear-gradient(135deg, #0d9488 0%, #134e4a 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
                            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
                            .content { color: #333; line-height: 1.6; }
                            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🐾 PetVerse</div>
                            </div>
                            <div class="content">
                                <h2 style="color: #0d9488;">Welcome to PetVerse!</h2>
                                <p>Thank you for choosing PetVerse. To complete your registration, please verify your email address with the following code:</p>
                                <div class="otp-box">
                                    <div>Your Verification Code:</div>
                                    <div class="otp-code">${otp}</div>
                                    <div style="font-size: 14px; margin-top: 10px;">Valid for 10 minutes</div>
                                </div>
                                <p>Enter this code on the verification page to activate your account and start exploring our pet services!</p>
                                <p>If you did not create an account with PetVerse, please ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated email. Please do not reply.</p>
                                <p>&copy; 2025 PetVerse. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
                break;

            default:
                subject = 'PetVerse - Your Verification Code';
                html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"PetVerse" <${process.env.EMAIL_USER || 'noreply@petverse.com'}>`,
            to: email,
            subject: subject,
            html: html
        };

        if (deliveryMode === 'console') {
            console.log('\n========== EMAIL_DELIVERY=console ==========');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('Purpose:', purpose);
            console.log('OTP:', otp);
            console.log('===========================================\n');
            return { success: true, delivered: 'console' };
        }

        if (shouldLogOtp()) {
            console.log(`[OTP] ${purpose} -> ${email}: ${otp}`);
        }

        const transporter = createTransporter();

        const info = await transporter.sendMail(mailOptions);
        
        console.log('Email sent successfully:', info.messageId);
        return { success: true, delivered: 'smtp', messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail
};
