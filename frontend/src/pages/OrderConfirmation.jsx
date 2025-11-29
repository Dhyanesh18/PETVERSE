import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaHome, FaReceipt } from 'react-icons/fa';

const OrderConfirmation = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { isAuthenticated } = useAuth();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/payment/order-confirmation/${orderId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setOrderDetails(data.data.order);
            } else {
                // Order not found, redirect to cart
                console.error('Order not found:', data.error);
                navigate('/cart');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            // On error, redirect to cart
            navigate('/cart');
        } finally {
            setLoading(false);
        }
    }, [orderId, navigate]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        if (orderId) {
            fetchOrderDetails();
        } else {
            // No order ID provided, redirect to cart
            navigate('/cart');
        }
    }, [isAuthenticated, navigate, orderId, fetchOrderDetails]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                        <span className="ml-3 text-lg text-gray-600">Loading order details...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Success Icon */}
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-8 shadow-lg">
                        <FaCheckCircle className="text-white text-4xl" />
                    </div>

                    {/* Success Message */}
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">
                        Order Placed Successfully!
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Thank you for your purchase. Your order has been confirmed and is being processed.
                    </p>

                    {/* Order Details Card */}
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <FaReceipt className="text-teal-600 text-2xl" />
                            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                        </div>
                        
                        <div className="space-y-4 text-left">
                            {orderDetails && (
                                <>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Order ID:</span>
                                        <span className="font-semibold text-gray-900 font-mono">#{orderDetails.orderNumber || orderDetails._id.slice(-8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Total Amount:</span>
                                        <span className="font-semibold text-gray-900">₹{orderDetails.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="font-semibold text-gray-900 capitalize">{orderDetails.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Order Status:</span>
                                        <span className={`font-semibold capitalize ${
                                            orderDetails.status === 'pending' ? 'text-yellow-600' : 
                                            orderDetails.status === 'processing' ? 'text-blue-600' : 'text-green-600'
                                        }`}>
                                            {orderDetails.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Payment Status:</span>
                                        <span className={`font-semibold capitalize ${
                                            orderDetails.paymentStatus === 'pending' ? 'text-yellow-600' : 
                                            orderDetails.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {orderDetails.paymentStatus}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Estimated Delivery:</span>
                                <span className="font-semibold text-gray-900">3-5 Business Days</span>
                            </div>
                        </div>
                        
                        {/* Order ID Highlight */}
                        {orderDetails && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Your Order ID</p>
                                    <p className="text-2xl font-bold text-teal-700 font-mono tracking-wider">
                                        #{orderDetails.orderNumber || orderDetails._id.slice(-8).toUpperCase()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Save this for tracking your order</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Order Summary */}
                        {orderDetails && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">₹{((orderDetails.totalAmount || 0) / 1.1 - (orderDetails.totalAmount >= 500 ? 0 : 50)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping:</span>
                                        <span className={`font-medium ${orderDetails.totalAmount >= 500 ? 'text-green-600' : ''}`}>
                                            {orderDetails.totalAmount >= 500 ? 'Free' : '₹50.00'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (10%):</span>
                                        <span className="font-medium">₹{((orderDetails.totalAmount || 0) * 0.1 / 1.1).toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-900">Total:</span>
                                            <span className="font-bold text-lg text-teal-600">₹{(orderDetails.totalAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Free shipping message */}
                                {orderDetails.totalAmount < 500 && (
                                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-600">🚚</span>
                                            <span className="text-orange-700 font-medium text-sm">
                                                Add ₹{(500 - (orderDetails.totalAmount / 1.1 - 50)).toFixed(2)} more for free shipping next time!
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {orderDetails.totalAmount >= 500 && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600">🎉</span>
                                            <span className="text-green-700 font-medium text-sm">You got free shipping!</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* What's Next */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                        <h3 className="text-lg font-bold text-blue-900 mb-3">What's Next?</h3>
                        <div className="text-blue-800 space-y-2">
                            <p>• You'll receive an email confirmation shortly</p>
                            <p>• Track your order in the "My Orders" section</p>
                            <p>• We'll notify you when your order ships</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            View My Orders
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold border border-gray-200"
                        >
                            <FaHome /> Continue Shopping
                        </button>
                    </div>

                    {/* Support Info */}
                    <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-2">Need Help?</h4>
                        <p className="text-gray-600 text-sm">
                            If you have any questions about your order, please contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
