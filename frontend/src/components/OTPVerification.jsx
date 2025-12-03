import React, { useState, useEffect, useRef } from 'react';
import { FaPaw, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const OTPVerification = ({ email, onVerify, onResend, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef([]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d+$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        
        // Handle paste
        if (value.length > 1) {
            const pastedData = value.slice(0, 6).split('');
            pastedData.forEach((char, i) => {
                if (index + i < 6 && /^\d$/.test(char)) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);
            
            // Focus the next empty input or the last one
            const nextIndex = Math.min(index + pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        // Handle single character input
        newOtp[index] = value;
        setOtp(newOtp);

        // Clear errors
        setError('');
        setSuccess('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (newOtp.every(digit => digit !== '') && index === 5) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newOtp = [...otp];
            
            if (otp[index]) {
                newOtp[index] = '';
                setOtp(newOtp);
            } else if (index > 0) {
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            }
        }
        // Handle left arrow
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Handle right arrow
        else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (/^\d{6}$/.test(pastedData)) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            
            // Auto-submit after paste
            setTimeout(() => {
                handleVerify(pastedData);
            }, 100);
        }
    };

    const handleVerify = async (otpValue = null) => {
        const otpString = otpValue || otp.join('');
        
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setIsVerifying(true);
        setError('');
        setSuccess('');

        try {
            await onVerify(otpString);
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setResendDisabled(true);
        setCountdown(60);
        setError('');
        setSuccess('');
        setOtp(['', '', '', '', '', '']);

        try {
            await onResend();
            setSuccess('New OTP sent successfully!');
            inputRefs.current[0]?.focus();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to resend OTP. Please try again.');
            setResendDisabled(false);
            setCountdown(0);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login/LOGIN_CROP.jpg')" }}
        >
            {/* Content */}
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] rounded-xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-teal-600 flex items-center justify-center gap-2 mb-2">
                            <FaPaw /> PetVerse
                        </h1>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Verify Your Email
                        </h2>
                        <p className="text-gray-600 text-sm">
                            We've sent a 6-digit code to
                        </p>
                        <p className="text-teal-600 font-semibold">
                            {email}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fadeIn">
                            <FaCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                            <p className="text-green-800 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fadeIn">
                            <FaTimesCircle className="text-red-600 text-xl flex-shrink-0" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* OTP Input */}
                    <div className="mb-8">
                        <div className="flex gap-2 justify-center mb-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        error 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                            : 'border-gray-300 focus:border-teal-500 focus:ring-teal-200'
                                    } ${digit ? 'bg-teal-50 border-teal-300' : 'bg-white'}`}
                                    disabled={isVerifying}
                                />
                            ))}
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-3">
                            Enter the 6-digit code sent to your email
                        </p>
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={() => handleVerify()}
                        disabled={otp.some(digit => !digit) || isVerifying}
                        className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                        {isVerifying ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            'Verify & Login'
                        )}
                    </button>

                    {/* Resend Section */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resendDisabled || isVerifying}
                            className="text-teal-600 font-semibold hover:text-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendDisabled ? (
                                `Resend in ${countdown}s`
                            ) : (
                                'Resend Code'
                            )}
                        </button>
                    </div>

                    {/* Back to Login */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <button
                            onClick={onBack}
                            disabled={isVerifying}
                            className="text-gray-600 hover:text-gray-800 transition-colors text-sm disabled:opacity-50"
                        >
                            ← Back to Login
                        </button>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800 text-center">
                            🔒 This code will expire in 10 minutes. Never share it with anyone.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
