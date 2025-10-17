import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginAPI } from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setServerError('');
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let error = '';

        if (name === 'email') {
            if (!value.trim()) {
                error = 'Email is required';
            } else if (!validateEmail(value)) {
                error = 'Please enter a valid email address';
            }
        } else if (name === 'password') {
            if (!value.trim()) {
                error = 'Password is required';
            } else if (!validatePassword(value)) {
                error = 'Password must be at least 6 characters';
            }
        }

        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(formData.password)) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await loginAPI(formData);
            if (response.data.success) {
                login(response.data.user);
                if (response.data.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (response.data.user.role === 'seller') {
                    navigate('/seller/dashboard');
                } else if (response.data.user.role === 'service-provider') {
                    navigate('/service-provider/dashboard');
                } else {
                    navigate('/home');
                }
            }
        } catch (error) {
            setServerError(error.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-4xl font-bold text-center text-indigo-600 mb-2 flex items-center justify-center gap-2">
                    <span className="text-5xl">🐾</span> PetVerse
                </h1>
                
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome Back!</h2>
                    <p className="text-gray-600">Sign in to continue your pet journey</p>
                    
                    {serverError && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <span className="text-xl">⚠️</span>
                            <span>{serverError}</span>
                        </div>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="your@email.com"
                            required
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 font-medium">{errors.email}</p>
                        )}
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600 font-medium">{errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                            Forgot Password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
                    >
                        Sign In
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        New to PetVerse?{' '}
                        <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-semibold">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
