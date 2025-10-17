import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const OrderDetails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        } else {
            setError('No order ID provided');
            setLoading(false);
        }
    }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrderDetails = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setOrder(data.order);
                } else {
                    setError('Order not found');
                }
            } else {
                setError('Failed to fetch order details');
            }
        } catch (err) {
            setError('Error loading order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getTrackingSteps = (status) => {
        const steps = [
            { id: 'pending', label: 'Order Placed', icon: '📝' },
            { id: 'processing', label: 'Processing', icon: '⚙️' },
            { id: 'shipped', label: 'Shipped', icon: '🚚' },
            { id: 'delivered', label: 'Delivered', icon: '📦' }
        ];

        const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'completed'];
        const currentIndex = statusOrder.indexOf(status);

        return steps.map((step, index) => ({
            ...step,
            completed: index <= currentIndex,
            active: index === currentIndex
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Go to Homepage
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const trackingSteps = order ? getTrackingSteps(order.status) : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Back
                        </button>
                        <h1 className="text-4xl font-bold text-gray-900">Order Details</h1>
                        {order && (
                            <p className="text-lg text-gray-600 mt-2">
                                Order #{order.orderNumber || order._id}
                            </p>
                        )}
                    </div>

                    {order && (
                        <>
                            {/* Order Tracking */}
                            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Tracking</h2>
                                
                                <div className="relative">
                                    <div className="flex items-center justify-between">
                                        {trackingSteps.map((step, index) => (
                                            <div key={step.id} className="flex flex-col items-center relative">
                                                {/* Step Circle */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                                                    step.completed 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'bg-gray-200 text-gray-400'
                                                } ${step.active ? 'ring-4 ring-blue-200' : ''}`}>
                                                    {step.completed ? '✓' : step.icon}
                                                </div>
                                                
                                                {/* Step Label */}
                                                <div className="mt-2 text-center">
                                                    <p className={`text-sm font-medium ${
                                                        step.completed ? 'text-blue-600' : 'text-gray-400'
                                                    }`}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                                
                                                {/* Connecting Line */}
                                                {index < trackingSteps.length - 1 && (
                                                    <div className={`absolute top-6 left-12 w-full h-0.5 ${
                                                        step.completed ? 'bg-blue-600' : 'bg-gray-200'
                                                    }`} style={{ width: 'calc(100vw / 4 - 3rem)' }}></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Current Status */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-blue-900">Current Status</p>
                                            <p className="text-blue-800 capitalize">{order.status}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Order Information */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Information</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">Order Number:</span>
                                            <span className="text-blue-600 font-mono">{order.orderNumber || order._id}</span>
                                        </div>
                                        
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">Order Date:</span>
                                            <span>{formatDate(order.createdAt)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">Payment Method:</span>
                                            <span className="capitalize">{order.paymentMethod}</span>
                                        </div>
                                        
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">Payment Status:</span>
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                order.paymentStatus === 'paid' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.paymentStatus}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between py-2">
                                            <span className="font-medium text-gray-600">Total Amount:</span>
                                            <span className="text-lg font-semibold">₹{order.totalAmount?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
                                    
                                    {order.shippingAddress && (
                                        <div className="space-y-2">
                                            <p className="font-medium text-lg">{order.shippingAddress.fullName}</p>
                                            <p className="text-gray-600">{order.shippingAddress.address}</p>
                                            <p className="text-gray-600">
                                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                            </p>
                                            <p className="text-gray-600">📞 {order.shippingAddress.phone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Items in this Order</h2>
                                
                                <div className="space-y-4">
                                    {order.items && order.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-lg">Product ID: {item.product}</h3>
                                                <p className="text-gray-600">
                                                    Quantity: {item.quantity} × ₹{item.price?.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-lg">₹{(item.quantity * item.price)?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Total */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-semibold">Total:</span>
                                        <span className="text-2xl font-bold text-blue-600">₹{order.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/products')}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Continue Shopping
                                </button>
                                
                                <button
                                    onClick={() => window.print()}
                                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Print Order Details
                                </button>
                            </div>

                            {/* Help Section */}
                            <div className="mt-8 bg-gray-100 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <p className="font-medium mb-1">📞 Customer Support</p>
                                        <p>Call us at: +91-XXXX-XXXX-XX</p>
                                        <p>Available: 9 AM - 6 PM (Mon-Sat)</p>
                                    </div>
                                    <div>
                                        <p className="font-medium mb-1">📧 Email Support</p>
                                        <p>support@petverse.com</p>
                                        <p>We'll respond within 24 hours</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;