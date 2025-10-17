import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const OrderConfirmation = () => {
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

    const getEstimatedDelivery = () => {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from now
        return deliveryDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                        <p className="text-lg text-gray-600">Thank you for your purchase. Your order has been successfully placed.</p>
                    </div>

                    {order && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Order Details */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Details</h2>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Order Number:</span>
                                        <span className="text-blue-600 font-mono">{order.orderNumber || order._id}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="font-medium">Order Date:</span>
                                        <span>{formatDate(order.createdAt)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="font-medium">Payment Method:</span>
                                        <span className="capitalize">{order.paymentMethod}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="font-medium">Payment Status:</span>
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            order.paymentStatus === 'paid' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="font-medium">Order Status:</span>
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            order.status === 'completed' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="font-medium">Total Amount:</span>
                                        <span className="text-lg font-semibold">₹{order.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Estimated Delivery */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 mb-2">📦 Estimated Delivery</h3>
                                    <p className="text-blue-800">{getEstimatedDelivery()}</p>
                                    <p className="text-sm text-blue-600 mt-1">We'll send you tracking information once your order ships.</p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
                                
                                {order.shippingAddress && (
                                    <div className="space-y-2">
                                        <p className="font-medium">{order.shippingAddress.fullName}</p>
                                        <p className="text-gray-600">{order.shippingAddress.address}</p>
                                        <p className="text-gray-600">
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                        </p>
                                        <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
                                    </div>
                                )}

                                {/* Order Items */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Items Ordered</h3>
                                    <div className="space-y-3">
                                        {order.items && order.items.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded">
                                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">Product ID: {item.product}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Quantity: {item.quantity} × ₹{item.price?.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="font-medium">
                                                    ₹{(item.quantity * item.price)?.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/order-details?orderId=' + orderId)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Track Your Order
                        </button>
                        
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Continue Shopping
                        </button>
                        
                        <button
                            onClick={() => navigate('/')}
                            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Back to Home
                        </button>
                    </div>

                    {/* Additional Information */}
                    <div className="mt-8 bg-gray-100 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-start space-x-2">
                                <span className="text-blue-600">1.</span>
                                <div>
                                    <p className="font-medium">Order Processing</p>
                                    <p>We're preparing your items for shipment.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-blue-600">2.</span>
                                <div>
                                    <p className="font-medium">Shipping Notification</p>
                                    <p>You'll receive tracking information via email.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-blue-600">3.</span>
                                <div>
                                    <p className="font-medium">Delivery</p>
                                    <p>Your order will arrive within 3-5 business days.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;