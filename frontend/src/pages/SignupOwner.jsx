import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';
import api from '../utils/api';

const SignupOwner = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        phoneNumber: '',
        fullName: '',
        agree: false
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'email':
                if (!value.trim()) error = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                    error = 'Invalid email format';
                break;
            case 'password':
                if (!value) error = 'Password is required';
                else if (value.length < 6)
                    error = 'Password must be at least 6 characters';
                break;
            case 'confirmPassword':
                if (value !== formData.password)
                    error = 'Passwords do not match';
                break;
            case 'username':
                if (!value.trim()) error = 'Username is required';
                break;
            case 'phoneNumber':
                if (!value.trim()) error = 'Phone number is required';
                break;
            case 'fullName':
                if (!value.trim()) error = 'Full name is required';
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({ ...prev, [name]: fieldValue }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'agree') {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (!formData.agree) {
            newErrors.agree = 'You must agree to terms and conditions';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post('/auth/signup/owner', formData);
            if (response.data.success) {
                navigate('/login', { 
                    state: { message: 'Registration successful! Please login.' }
                });
            }
        } catch (error) {
            setErrors({
                server: error.response?.data?.error || 'Registration failed. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center py-5 px-4 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login/LOGIN_CROP.jpg')" }}
        >
            <div className="w-full max-w-4xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] rounded-2xl p-8 my-2 relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-teal-600 text-3xl font-semibold flex items-center gap-2">
                        <FaPaw /> PetVerse
                    </h1>
                    <div className="text-center">
                        <h2 className="text-gray-800 text-3xl font-semibold mb-2">Join PetVerse Today</h2>
                        <p className="text-gray-600 text-sm">Sign up to explore the world of PetVerse!</p>
                    </div>
                </div>

                {errors.server && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4">
                        {errors.server}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="-mt-8">
                    <div className="flex justify-between gap-5">
                        {/* Left Form */}
                        <div className="w-1/2">
                            {/* Email */}
                            <div className="relative mt-6 mb-4">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder=" "
                                    className="peer w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mt-4 text-sm transition-all bg-gray-50 focus:bg-white focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] focus:outline-none"
                                />
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-1 text-sm text-gray-600 transition-all pointer-events-none peer-focus:top-4 peer-focus:left-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-teal-500 peer-focus:z-10 peer-focus:px-1.5 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-teal-500 peer-[:not(:placeholder-shown)]:z-10 peer-[:not(:placeholder-shown)]:px-1.5">
                                    Email Address<span className="text-red-500">*</span>
                                </label>
                                {touched.email && errors.email && (
                                    <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{errors.email}</span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="relative mt-6 mb-4">
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder=" "
                                    className="peer w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mt-4 text-sm transition-all bg-gray-50 focus:bg-white focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] focus:outline-none"
                                />
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-1 text-sm text-gray-600 transition-all pointer-events-none peer-focus:top-4 peer-focus:left-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-teal-500 peer-focus:z-10 peer-focus:px-1.5 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-teal-500 peer-[:not(:placeholder-shown)]:z-10 peer-[:not(:placeholder-shown)]:px-1.5">
                                    Password<span className="text-red-500">*</span>
                                </label>
                                {touched.password && errors.password && (
                                    <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{errors.password}</span>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="relative mt-6 mb-4">
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder=" "
                                    className="peer w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mt-4 text-sm transition-all bg-gray-50 focus:bg-white focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] focus:outline-none"
                                />
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-1 text-sm text-gray-600 transition-all pointer-events-none peer-focus:top-4 peer-focus:left-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-teal-500 peer-focus:z-10 peer-focus:px-1.5 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-teal-500 peer-[:not(:placeholder-shown)]:z-10 peer-[:not(:placeholder-shown)]:px-1.5">
                                    Confirm Password<span className="text-red-500">*</span>
                                </label>
                                {touched.confirmPassword && errors.confirmPassword && (
                                    <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{errors.confirmPassword}</span>
                                )}
                            </div>
                        </div>

                        {/* Right Form */}
                        <div className="w-1/2">
                            {/* Username */}
                            <div className="relative mt-6 mb-4">
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder=" "
                                    className="peer w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mt-4 text-sm transition-all bg-gray-50 focus:bg-white focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] focus:outline-none"
                                />
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-1 text-sm text-gray-600 transition-all pointer-events-none peer-focus:top-4 peer-focus:left-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-teal-500 peer-focus:z-10 peer-focus:px-1.5 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-teal-500 peer-[:not(:placeholder-shown)]:z-10 peer-[:not(:placeholder-shown)]:px-1.5">
                                    Username<span className="text-red-500">*</span>
                                </label>
                                {touched.username && errors.username && (
                                    <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{errors.username}</span>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div className="relative mt-6 mb-4">
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder=" "
                                    className="peer w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mt-4 text-sm transition-all bg-gray-50 focus:bg-white focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] focus:outline-none"
                                />
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-1 text-sm text-gray-600 transition-all pointer-events-none peer-focus:top-4 peer-focus:left-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-teal-500 peer-focus:z-10 peer-focus:px-1.5 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-teal-500 peer-[:not(:placeholder-shown)]:z-10 peer-[:not(:placeholder-shown)]:px-1.5">
                                    Phone Number<span className="text-red-500">*</span>
                                </label>
                                {touched.phoneNumber && errors.phoneNumber && (
                                    <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{errors.phoneNumber}</span>
                                )}
                            </div>

                            {/* Full Name */}
                            <div className="relative mt-6 mb-4">
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder=" "
                                    className="peer w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mt-4 text-sm transition-all bg-gray-50 focus:bg-white focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)] focus:outline-none"
                                />
                                <label className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-1 text-sm text-gray-600 transition-all pointer-events-none peer-focus:top-4 peer-focus:left-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-teal-500 peer-focus:z-10 peer-focus:px-1.5 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-teal-500 peer-[:not(:placeholder-shown)]:z-10 peer-[:not(:placeholder-shown)]:px-1.5">
                                    Full Name<span className="text-red-500">*</span>
                                </label>
                                {touched.fullName && errors.fullName && (
                                    <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{errors.fullName}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex justify-between items-center mb-2.5 mt-2">
                        <label className="text-sm text-gray-700 flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="agree"
                                checked={formData.agree}
                                onChange={handleChange}
                                className="w-4 h-4 accent-teal-600"
                            />
                            I agree to the{' '}
                            <a href="#" className="text-teal-600 no-underline font-medium hover:underline">
                                Terms and Conditions
                            </a>{' '}
                            and{' '}
                            <a href="#" className="text-teal-600 no-underline font-medium hover:underline">
                                Privacy Policy
                            </a>
                        </label>
                    </div>
                    {errors.agree && <span className="text-red-500 text-xs ml-2">{errors.agree}</span>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-linear-to-br from-teal-600 to-gray-800 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 mb-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(38,70,83,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                    </button>

                    {/* Login Link */}
                    <div className="text-center text-gray-600 text-sm mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-600 font-medium ml-1 hover:text-gray-800 no-underline transition-colors">
                            Log In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupOwner;
