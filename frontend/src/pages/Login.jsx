import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaPaw, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        server: ''
    });
    const [touched, setTouched] = useState({
        email: false,
        password: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login: loginUser } = useAuth();
    
    // Get the page user was trying to access before login
    const from = location.state?.from?.pathname || null;

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('/auth/check-session');
                if (response.data.success && response.data.isLoggedIn) {
                    // If user is already logged in and there's a 'from' location, go there
                    // Otherwise redirect based on user role
                    if (from && from !== '/login') {
                        navigate(from, { replace: true });
                        return;
                    }
                    
                    const role = response.data.userRole;
                    switch(role) {
                        case 'owner':
                            navigate('/dashboard', { replace: true });
                            break;
                        case 'seller':
                            navigate('/seller/dashboard', { replace: true });
                            break;
                        case 'service_provider':
                            navigate('/service-provider/dashboard', { replace: true });
                            break;
                        case 'admin':
                            navigate('/admin/dashboard', { replace: true });
                            break;
                        default:
                            navigate('/home', { replace: true });
                    }
                }
            } catch (error) {
                console.error('Session check error:', error);
            }
        };
        checkSession();
    }, [navigate, from]);

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Password validation
    const isValidPassword = (password) => {
        return password.length >= 6;
    };

    // Validate single field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'email':
                if (!value.trim()) {
                    error = 'Email is required';
                } else if (!isValidEmail(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'password':
                if (!value.trim()) {
                    error = 'Password is required';
                } else if (!isValidPassword(value)) {
                    error = 'Password must be at least 6 characters';
                }
                break;
            default:
                break;
        }

        return error;
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Clear server error
        if (errors.server) {
            setErrors(prev => ({
                ...prev,
                server: ''
            }));
        }
    };

    // Handle blur (field loses focus)
    const handleBlur = (e) => {
        const { name, value } = e.target;
        
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    // Validate all fields
    const validateForm = () => {
        const newErrors = {
            email: validateField('email', formData.email),
            password: validateField('password', formData.password),
            server: ''
        };

        setErrors(newErrors);
        setTouched({
            email: true,
            password: true
        });

        return !newErrors.email && !newErrors.password;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear server error
        setErrors(prev => ({ ...prev, server: '' }));

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                console.log('Login response:', response.data.user);
                
                // Update AuthContext with user data
                await loginUser(response.data.user);
                
                console.log('After loginUser called');
                
                // Store user data if needed
                if (formData.rememberMe) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }

                // Wait for session to be set before navigating
                await new Promise(resolve => setTimeout(resolve, 100));

                // Redirect based on role from the login response
                const role = response.data.user?.role || response.data.userRole;
                console.log('Redirecting with role:', role);

                let redirectPath = '/';

                // Only use 'from' if it's not a role-specific dashboard or login/unauthorized page
                const shouldUseFrom = from && 
                    !from.includes('/dashboard') && 
                    from !== '/login' && 
                    from !== '/unauthorized';

                if (shouldUseFrom) {
                    redirectPath = from;
                } else {
                    // Always redirect based on current user's role
                    switch(role) {
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
                }

                console.log('Final redirect path:', redirectPath);
                navigate(redirectPath, { replace: true });
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response?.data?.error) {
                setErrors(prev => ({
                    ...prev,
                    server: error.response.data.error
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    server: 'Login failed. Please check your credentials and try again.'
                }));
            }
        } finally {
            setIsSubmitting(false);
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
                    <h2 className="text-gray-800 text-2xl font-semibold mb-2">Welcome Back!</h2>
                    <p className="text-gray-600 text-sm">Sign in to continue your pet journey</p>

                    {/* Server Error Message */}
                    {errors.server && (
                        <div className="mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded flex items-start gap-2">
                            <FaExclamationCircle className="mt-0.5 shrink-0" />
                            <span className="text-sm font-medium">{errors.server}</span>
                        </div>
                    )}
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`peer w-full px-3 py-3 border-2 rounded-lg mt-1.5 mb-0.5 text-sm transition-all duration-300 bg-gray-50 focus:bg-white focus:outline-none ${
                                touched.email && errors.email
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)]'
                            }`}
                            required
                        />
                        <label
                            htmlFor="email"
                            className={`absolute left-3 px-1 text-sm transition-all duration-300 pointer-events-none ${
                                formData.email
                                    ? '-top-2 scale-90 bg-white text-teal-500'
                                    : 'top-1/2 -translate-y-1/2 bg-transparent text-gray-600'
                            }`}
                        >
                            Email Address
                        </label>
                        {touched.email && errors.email && (
                            <span className="block text-red-500 text-xs font-bold mt-1 ml-2">
                                {errors.email}
                            </span>
                        )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`peer w-full px-3 py-3 border-2 rounded-lg mt-1.5 mb-0.5 text-sm transition-all duration-300 bg-gray-50 focus:bg-white focus:outline-none ${
                                touched.password && errors.password
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:border-teal-500 focus:shadow-[0_0_8px_rgba(95,158,160,0.1)]'
                            }`}
                            required
                        />
                        <label
                            htmlFor="password"
                            className={`absolute left-3 px-1 text-sm transition-all duration-300 pointer-events-none ${
                                formData.password
                                    ? '-top-2 scale-90 bg-white text-teal-500'
                                    : 'top-1/2 -translate-y-1/2 bg-transparent text-gray-600'
                            }`}
                        >
                            Password
                        </label>
                        {touched.password && errors.password && (
                            <span className="block text-red-500 text-xs font-bold mt-1 ml-2">
                                {errors.password}
                            </span>
                        )}
                    </div>

                    {/* Options Group */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-gray-600 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="w-3.5 h-3.5 accent-teal-500"
                            />
                            <span>Remember me</span>
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-teal-700 text-xs hover:text-black transition-colors duration-300 no-underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-linear-to-br from-teal-600 to-gray-800 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 mb-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(38,70,83,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <span className={isSubmitting ? 'opacity-0' : 'opacity-100'}>
                            Sign In
                        </span>
                        {isSubmitting && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </button>

                    {/* Signup Link */}
                    <div className="text-center text-gray-600 text-sm">
                        New to PetVerse?{' '}
                        <Link
                            to="/signup"
                            className="text-teal-600 font-medium ml-1 hover:text-black transition-colors duration-300 no-underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;