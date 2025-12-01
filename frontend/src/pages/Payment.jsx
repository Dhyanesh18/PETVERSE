import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaWallet, FaCreditCard, FaMobile, FaMoneyBillWave, FaArrowLeft, FaLock } from 'react-icons/fa';
import { processPayment } from '../services/api';

const Payment = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet');
    const [paymentDetails, setPaymentDetails] = useState({
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        upiId: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Check if shipping info exists (handled by backend session)
        const storedShippingInfo = localStorage.getItem('shippingInfo');
        if (!storedShippingInfo) {
            navigate('/checkout');
            return;
        }
    }, [isAuthenticated, navigate]);

    const handlePayment = async () => {
        setSubmitting(true);
        setError('');

        try {
            const paymentData = {
                paymentMethod: selectedPaymentMethod,
                paymentDetails: selectedPaymentMethod === 'card' ? paymentDetails : undefined,
                upiId: selectedPaymentMethod === 'upi' ? paymentDetails.upiId : undefined
            };

            const response = await processPayment(paymentData);
            if (response.data.success) {
                // Clear stored shipping info
                localStorage.removeItem('shippingInfo');
                // Navigate to order confirmation with order ID
                const orderId = response.data.data.orderId;
                navigate(`/order-confirmation/${orderId}`);
            } else {
                setError(response.data.error || 'Payment failed');
            }
        } catch (err) {
            console.error('Payment error:', err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Payment failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mb-4">
                            <span className="text-white text-2xl">💳</span>
                        </div> */}
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-2">Payment</h1>
                        <p className="text-xl text-gray-600">Choose your preferred payment method</p>
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

                    {/* Payment Methods */}
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Method</h2>
                        
                        <div className="space-y-4">
                            {/* PetVerse Wallet */}
                            <div 
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedPaymentMethod === 'wallet' 
                                        ? 'border-teal-500 bg-teal-50' 
                                        : 'border-gray-200 hover:border-teal-300'
                                }`}
                                onClick={() => setSelectedPaymentMethod('wallet')}
                            >
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        checked={selectedPaymentMethod === 'wallet'}
                                        onChange={() => setSelectedPaymentMethod('wallet')}
                                        className="text-teal-600"
                                    />
                                    <FaWallet className="text-teal-600 text-xl" />
                                    <div>
                                        <div className="font-semibold text-gray-900">PetVerse Wallet</div>
                                        <div className="text-sm text-gray-600">Pay using your wallet balance</div>
                                    </div>
                                </div>
                            </div>

                            {/* Credit/Debit Card */}
                            <div 
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedPaymentMethod === 'card' 
                                        ? 'border-teal-500 bg-teal-50' 
                                        : 'border-gray-200 hover:border-teal-300'
                                }`}
                                onClick={() => setSelectedPaymentMethod('card')}
                            >
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        checked={selectedPaymentMethod === 'card'}
                                        onChange={() => setSelectedPaymentMethod('card')}
                                        className="text-teal-600"
                                    />
                                    <FaCreditCard className="text-gray-600 text-xl" />
                                    <div>
                                        <div className="font-semibold text-gray-900">Credit / Debit Card</div>
                                        <div className="text-sm text-gray-600">Pay securely with your card</div>
                                    </div>
                                </div>
                                {selectedPaymentMethod === 'card' && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                                            <input
                                                type="text"
                                                value={paymentDetails.cardName}
                                                onChange={(e) => setPaymentDetails({...paymentDetails, cardName: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder="Enter name on card"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                                            <input
                                                type="text"
                                                value={paymentDetails.cardNumber}
                                                onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder="1234 5678 9012 3456"
                                                maxLength="19"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.expiryDate}
                                                    onChange={(e) => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    placeholder="MM/YY"
                                                    maxLength="5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.cvv}
                                                    onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    placeholder="123"
                                                    maxLength="4"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* UPI */}
                            <div 
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedPaymentMethod === 'upi' 
                                        ? 'border-teal-500 bg-teal-50' 
                                        : 'border-gray-200 hover:border-teal-300'
                                }`}
                                onClick={() => setSelectedPaymentMethod('upi')}
                            >
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        checked={selectedPaymentMethod === 'upi'}
                                        onChange={() => setSelectedPaymentMethod('upi')}
                                        className="text-teal-600"
                                    />
                                    <FaMobile className="text-purple-600 text-xl" />
                                    <div>
                                        <div className="font-semibold text-gray-900">UPI</div>
                                        <div className="text-sm text-gray-600">Pay using Google Pay, PhonePe, Paytm</div>
                                    </div>
                                </div>
                                {selectedPaymentMethod === 'upi' && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                                        <input
                                            type="text"
                                            value={paymentDetails.upiId}
                                            onChange={(e) => setPaymentDetails({...paymentDetails, upiId: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            placeholder="yourname@upi"
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Google Pay</span>
                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">PhonePe</span>
                                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Paytm</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cash on Delivery */}
                            <div 
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedPaymentMethod === 'cod' 
                                        ? 'border-teal-500 bg-teal-50' 
                                        : 'border-gray-200 hover:border-teal-300'
                                }`}
                                onClick={() => setSelectedPaymentMethod('cod')}
                            >
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        checked={selectedPaymentMethod === 'cod'}
                                        onChange={() => setSelectedPaymentMethod('cod')}
                                        className="text-teal-600"
                                    />
                                    <FaMoneyBillWave className="text-green-600 text-xl" />
                                    <div>
                                        <div className="font-semibold text-gray-900">Cash on Delivery</div>
                                        <div className="text-sm text-gray-600">Pay when you receive your order</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FaLock className="text-blue-600 text-lg" />
                                <div>
                                    <div className="font-medium text-blue-800">Secure Payment</div>
                                    <div className="text-sm text-blue-600">
                                        Your payment information is encrypted and secure
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/checkout')}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold border border-gray-200"
                        >
                            <FaArrowLeft /> Back to Shipping
                        </button>
                        
                        <button
                            onClick={handlePayment}
                            disabled={submitting}
                            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing Payment...
                                </div>
                            ) : (
                                'Complete Payment'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
