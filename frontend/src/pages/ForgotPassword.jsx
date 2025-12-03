import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaPaw } from 'react-icons/fa';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [touched, setTouched] = useState({
        email: false,
        newPassword: false,
        confirmPassword: false
    });
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Password validation
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) {
            errors.push('at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('one number');
        }
        return errors;
    };

    // Validate email field
    const validateEmailField = (value) => {
        if (!value.trim()) {
            return 'Email is required';
        }
        if (!isValidEmail(value)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    // Handle field blur for validation
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        
        if (field === 'email') {
            setValidationErrors(prev => ({
                ...prev,
                email: validateEmailField(email)
            }));
        } else if (field === 'newPassword') {
            const passwordErrors = validatePassword(newPassword);
            setValidationErrors(prev => ({
                ...prev,
                newPassword: passwordErrors.length > 0 ? `Password must contain ${passwordErrors.join(', ')}` : ''
            }));
        } else if (field === 'confirmPassword') {
            setValidationErrors(prev => ({
                ...prev,
                confirmPassword: confirmPassword !== newPassword ? 'Passwords do not match' : ''
            }));
        }
    };

    // Real-time validation for password matching
    const handlePasswordChange = (field, value) => {
        if (field === 'newPassword') {
            setNewPassword(value);
            if (touched.newPassword) {
                const passwordErrors = validatePassword(value);
                setValidationErrors(prev => ({
                    ...prev,
                    newPassword: passwordErrors.length > 0 ? `Password must contain ${passwordErrors.join(', ')}` : ''
                }));
            }
            // Also validate confirm password if it's been touched
            if (touched.confirmPassword && confirmPassword) {
                setValidationErrors(prev => ({
                    ...prev,
                    confirmPassword: confirmPassword !== value ? 'Passwords do not match' : ''
                }));
            }
        } else if (field === 'confirmPassword') {
            setConfirmPassword(value);
            if (touched.confirmPassword) {
                setValidationErrors(prev => ({
                    ...prev,
                    confirmPassword: value !== newPassword ? 'Passwords do not match' : ''
                }));
            }
        }
    };

    // Step 1: Send OTP to email
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validate email before submission
        const emailError = validateEmailField(email);
        if (emailError) {
            setValidationErrors(prev => ({ ...prev, email: emailError }));
            setTouched(prev => ({ ...prev, email: true }));
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/forgot-password/send-otp`,
                { email },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage(response.data.message);
                setStep(2);
            } else {
                setError(response.data.error || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('Send OTP error:', err);
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/forgot-password/verify-otp`,
                { email, otp },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage(response.data.message);
                setStep(3);
            } else {
                setError(response.data.error || 'Invalid OTP');
            }
        } catch (err) {
            console.error('Verify OTP error:', err);
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validate password strength
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            setError(`Password must contain ${passwordErrors.join(', ')}`);
            setValidationErrors(prev => ({
                ...prev,
                newPassword: `Password must contain ${passwordErrors.join(', ')}`
            }));
            setTouched(prev => ({ ...prev, newPassword: true }));
            return;
        }

        // Validate password match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setValidationErrors(prev => ({
                ...prev,
                confirmPassword: 'Passwords do not match'
            }));
            setTouched(prev => ({ ...prev, confirmPassword: true }));
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/forgot-password/reset-password`,
                { email, otp, newPassword },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage(response.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.data.error || 'Failed to reset password');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/forgot-password/send-otp`,
                { email },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage('New OTP sent to your email');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
            style={{
                backgroundImage: "url('/images/login/LOGIN_CROP.jpg')"
            }}
        >
            <div className="w-full max-w-md bg-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] rounded-xl p-8">
                {/* Logo */}
                <h1 className="text-teal-600 text-center text-3xl font-bold mb-6 flex items-center justify-center gap-2">
                    <FaPaw /> PetVerse
                </h1>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-gray-800 text-2xl font-semibold mb-2">Reset Password</h2>
                    <p className="text-gray-600 text-sm">Follow the steps to recover your account</p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-between mb-8 px-4">
                    <div className="flex flex-col items-center flex-1" style={{ opacity: step >= 1 ? 1 : 0.5 }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-white font-bold text-sm ${
                            step >= 1 ? 'bg-teal-600' : 'bg-gray-300'
                        }`}>
                            1
                        </div>
                        <small className="text-xs text-gray-600">Email</small>
                    </div>
                    <div className="flex flex-col items-center flex-1" style={{ opacity: step >= 2 ? 1 : 0.5 }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-white font-bold text-sm ${
                            step >= 2 ? 'bg-teal-600' : 'bg-gray-300'
                        }`}>
                            2
                        </div>
                        <small className="text-xs text-gray-600">Verify OTP</small>
                    </div>
                    <div className="flex flex-col items-center flex-1" style={{ opacity: step >= 3 ? 1 : 0.5 }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-white font-bold text-sm ${
                            step >= 3 ? 'bg-teal-600' : 'bg-gray-300'
                        }`}>
                            3
                        </div>
                        <small className="text-xs text-gray-600">New Password</small>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {message && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm">
                        {message}
                    </div>
                )}

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (touched.email) {
                                        setValidationErrors(prev => ({
                                            ...prev,
                                            email: validateEmailField(e.target.value)
                                        }));
                                    }
                                }}
                                onBlur={() => handleBlur('email')}
                                className={`peer w-full px-3 py-3 border-2 rounded-lg mt-1.5 mb-0.5 text-sm transition-all duration-300 bg-gray-50 focus:bg-white focus:outline-none ${
                                    touched.email && validationErrors.email
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)]'
                                }`}
                                required
                                autoFocus
                            />
                            <label
                                htmlFor="email"
                                className={`absolute left-3 px-1 text-sm transition-all duration-300 pointer-events-none ${
                                    email
                                        ? '-top-2 scale-90 bg-white text-teal-500'
                                        : 'top-1/2 -translate-y-1/2 bg-transparent text-gray-600'
                                }`}
                            >
                                Email Address
                            </label>
                            {touched.email && validationErrors.email && (
                                <span className="block text-red-500 text-xs font-bold mt-1 ml-2">
                                    {validationErrors.email}
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email || (touched.email && validationErrors.email)}
                            className="w-full py-3.5 bg-gradient-to-br from-teal-600 to-gray-800 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 mb-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(38,70,83,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                'Send OTP'
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                        <div className="relative">
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="peer w-full px-3 py-3 border-2 border-gray-300 rounded-lg mt-1.5 mb-0.5 text-lg transition-all duration-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] text-center tracking-[0.5em]"
                                required
                                autoFocus
                                maxLength="6"
                                placeholder="000000"
                            />
                            <label
                                htmlFor="otp"
                                className="absolute left-3 -top-2 px-1 text-sm bg-white text-teal-500 scale-90"
                            >
                                Enter 6-Digit OTP
                            </label>
                            <small className="block mt-2 text-xs text-gray-600 text-center">
                                Check your email for the OTP (valid for 10 minutes)
                            </small>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3.5 bg-gradient-to-br from-teal-600 to-gray-800 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 mb-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(38,70,83,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                'Verify OTP'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={loading}
                            className="w-full py-3 border-2 border-teal-600 bg-transparent text-teal-600 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Resend OTP
                        </button>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="relative">
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                onBlur={() => handleBlur('newPassword')}
                                className={`peer w-full px-3 py-3 border-2 rounded-lg mt-1.5 mb-0.5 text-sm transition-all duration-300 bg-gray-50 focus:bg-white focus:outline-none ${
                                    touched.newPassword && validationErrors.newPassword
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)]'
                                }`}
                                required
                                autoFocus
                                minLength="8"
                            />
                            <label
                                htmlFor="newPassword"
                                className={`absolute left-3 px-1 text-sm transition-all duration-300 pointer-events-none ${
                                    newPassword
                                        ? '-top-2 scale-90 bg-white text-teal-500'
                                        : 'top-1/2 -translate-y-1/2 bg-transparent text-gray-600'
                                }`}
                            >
                                New Password
                            </label>
                            {touched.newPassword && validationErrors.newPassword ? (
                                <span className="block text-red-500 text-xs font-bold mt-1 ml-2">
                                    {validationErrors.newPassword}
                                </span>
                            ) : (
                                <small className="block mt-2 text-xs text-gray-600">
                                    Must contain 8+ characters, uppercase, lowercase, and number
                                </small>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                onBlur={() => handleBlur('confirmPassword')}
                                className={`peer w-full px-3 py-3 border-2 rounded-lg mt-1.5 mb-0.5 text-sm transition-all duration-300 bg-gray-50 focus:bg-white focus:outline-none ${
                                    touched.confirmPassword && validationErrors.confirmPassword
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)]'
                                }`}
                                required
                                minLength="8"
                            />
                            <label
                                htmlFor="confirmPassword"
                                className={`absolute left-3 px-1 text-sm transition-all duration-300 pointer-events-none ${
                                    confirmPassword
                                        ? '-top-2 scale-90 bg-white text-teal-500'
                                        : 'top-1/2 -translate-y-1/2 bg-transparent text-gray-600'
                                }`}
                            >
                                Confirm Password
                            </label>
                            {touched.confirmPassword && validationErrors.confirmPassword && (
                                <span className="block text-red-500 text-xs font-bold mt-1 ml-2">
                                    {validationErrors.confirmPassword}
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword || validationErrors.newPassword || validationErrors.confirmPassword}
                            className="w-full py-3.5 bg-gradient-to-br from-teal-600 to-gray-800 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 mb-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(38,70,83,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                {/* Back to Login Link */}
                <div className="text-center mt-6 pt-4 border-t border-gray-200">
                    <Link
                        to="/login"
                        className="text-teal-700 text-sm hover:text-black transition-colors duration-300 no-underline"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
