import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCheckoutData } from '../services/api';
import { FaShieldAlt, FaWallet, FaArrowLeft } from 'react-icons/fa';

const Checkout = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checkoutData, setCheckoutData] = useState({ cart: { items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 }, user: {} });
    
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
    });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchCheckoutData();
    }, [isAuthenticated, navigate]);

    const fetchCheckoutData = async () => {
        try {
            setLoading(true);
            const response = await getCheckoutData();
            if (response.data.success) {
                setCheckoutData(response.data.data);
                // Pre-fill user info if available
                if (response.data.data.user) {
                    setShippingInfo(prev => ({
                        ...prev,
                        fullName: response.data.data.user.fullName || prev.fullName,
                        phone: response.data.data.user.phone || prev.phone
                    }));
                }
            } else {
                setError('Failed to load checkout data');
            }
        } catch (err) {
            console.error('Error fetching checkout data:', err);
            setError('Failed to load checkout data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!shippingInfo.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }
        
        if (!shippingInfo.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(shippingInfo.phone.replace(/\D/g, ''))) {
            errors.phone = 'Please enter a valid 10-digit phone number';
        }
        
        if (!shippingInfo.address.trim()) {
            errors.address = 'Address is required';
        }
        
        if (!shippingInfo.city.trim()) {
            errors.city = 'City is required';
        }
        
        if (!shippingInfo.state.trim()) {
            errors.state = 'State is required';
        }
        
        if (!shippingInfo.zipCode.trim()) {
            errors.zipCode = 'ZIP code is required';
        } else if (!/^[0-9]{6}$/.test(shippingInfo.zipCode)) {
            errors.zipCode = 'Please enter a valid 6-digit ZIP code';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const { cart = { items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 } } = checkoutData;
    
    // Ensure cart values are properly formatted
    const safeCart = {
        items: cart.items || [],
        subtotal: parseFloat(cart.subtotal || 0),
        shipping: parseFloat(cart.shipping || 0),
        tax: parseFloat(cart.tax || 0),
        total: parseFloat(cart.total || 0)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-lg text-gray-600">Loading checkout...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mb-4">
                            <span className="text-white text-2xl">🛒</span>
                        </div> */}
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-2">Checkout</h1>
                        <p className="text-xl text-gray-600">Complete your order securely and safely</p>
                        <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mx-auto mt-4"></div>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 text-sm">⚠️</span>
                            </div>
                            <div>
                                <div className="font-semibold">Error</div>
                                <div className="text-sm">{error}</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Shipping & Payment */}
                        <div className="space-y-6">
                            {/* Shipping Information */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                <div className="flex items-center gap-3 mb-6">
                                    {/* <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <span className="text-indigo-600 text-lg">📦</span>
                                    </div> */}
                                    <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={shippingInfo.fullName}
                                            onChange={handleInputChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                                                validationErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your full name"
                                        />
                                        {validationErrors.fullName && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={shippingInfo.phone}
                                            onChange={handleInputChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                                                validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your phone number"
                                        />
                                        {validationErrors.phone && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={shippingInfo.address}
                                        onChange={handleInputChange}
                                        required
                                        rows="3"
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                                            validationErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Street address, apartment, suite, etc."
                                    />
                                    {validationErrors.address && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={shippingInfo.city}
                                            onChange={handleInputChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                                                validationErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your city"
                                        />
                                        {validationErrors.city && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={shippingInfo.state}
                                            onChange={handleInputChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                                                validationErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your state"
                                        />
                                        {validationErrors.state && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ZIP Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={shippingInfo.zipCode}
                                            onChange={handleInputChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                                                validationErrors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter ZIP code"
                                        />
                                        {validationErrors.zipCode && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.zipCode}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => navigate('/cart')}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold border border-gray-200"
                                    >
                                        Back to Cart
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            if (validateForm()) {
                                                // Store shipping info in localStorage and navigate to payment
                                                localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
                                                navigate('/payment');
                                            } else {
                                                setError('Please fill in all required fields correctly.');
                                            }
                                        }}
                                        disabled={safeCart.items.length === 0}
                                        className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6 h-fit border border-gray-100">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-teal-100 to-teal-200 rounded-full mb-3">
                                    <span className="text-2xl">📋</span>
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">Order Summary</h2>
                                <div className="w-16 h-0.5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mx-auto mt-2"></div>
                            </div>
                            
                            {/* Cart Items */}
                            <div className="space-y-4 mb-6">
                                {safeCart.items.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                                ) : (
                                    safeCart.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-teal-200 transition-colors">
                                            <img
                                                src={
                                                    item.images && item.images.length > 0
                                                        ? `http://localhost:8080/api/${item.itemType === 'Pet' ? 'pets' : 'products'}/${item.productId || item._id}/image/0`
                                                        : item.itemType === 'Pet'
                                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    if (item.itemType === 'Pet') {
                                                        e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/64x64/e5e7eb/6b7280?text=' + encodeURIComponent(item.name.substring(0, 5));
                                                    }
                                                }}
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Qty: {item.quantity}</span>
                                                    <div className="text-right">
                                                        <div className="font-bold text-teal-600">₹{(item.price * item.quantity).toFixed(2)}</div>
                                                        {item.discount > 0 && (
                                                            <div className="text-xs text-gray-400 line-through">
                                                                ₹{(item.originalPrice * item.quantity).toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Order Totals */}
                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-semibold">₹{safeCart.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className={`font-semibold ${safeCart.shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {safeCart.shipping === 0 ? 'Free' : `₹${safeCart.shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-600">Tax (10%):</span>
                                    <span className="font-semibold">₹{safeCart.tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900">Total:</span>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">₹{safeCart.total.toFixed(2)}</span>
                                </div>
                            </div>


                            {safeCart.subtotal >= 500 ? (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">🎉</span>
                                        <span className="text-green-700 font-medium text-sm">You got free shipping!</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-orange-600">🚚</span>
                                        <span className="text-orange-700 font-medium text-sm">
                                            Add ₹{(500 - safeCart.subtotal).toFixed(2)} more for free shipping
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;