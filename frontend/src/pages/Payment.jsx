import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { FaWallet, FaCreditCard, FaMobile, FaMoneyBillWave, FaArrowLeft, FaLock } from 'react-icons/fa';
import { processPayment, verifyRazorpayPayment } from '../services/api';
import { fetchWalletData } from '../redux/slices/walletSlice';

const Payment = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated } = useAuth();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet');
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
            const paymentData = { paymentMethod: selectedPaymentMethod };

            const response = await processPayment(paymentData);

            if (!response.data?.success) {
                setError(response.data?.error || 'Payment failed');
                return;
            }

            // Razorpay flow for real money payments
            if ((selectedPaymentMethod === 'card' || selectedPaymentMethod === 'upi') && response.data?.data?.razorpayOrderId) {
                const {
                    orderId,
                    razorpayOrderId,
                    amountPaise,
                    currency,
                    keyId,
                    customer
                } = response.data.data;

                const loadRazorpay = () => {
                    return new Promise((resolve) => {
                        if (window.Razorpay) return resolve(true);
                        const script = document.createElement('script');
                        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        script.onload = () => resolve(true);
                        script.onerror = () => resolve(false);
                        document.body.appendChild(script);
                    });
                };

                const ok = await loadRazorpay();
                if (!ok) {
                    setError('Failed to load Razorpay. Please try again.');
                    return;
                }

                const options = {
                    key: keyId,
                    amount: amountPaise,
                    currency: currency || 'INR',
                    name: 'PetVerse',
                    description: 'Order Payment',
                    order_id: razorpayOrderId,
                    prefill: {
                        name: customer?.name || '',
                        email: customer?.email || '',
                        contact: customer?.contact || ''
                    },
                    notes: {
                        orderId
                    },
                    handler: async function (rzpResponse) {
                        try {
                            const verifyResp = await verifyRazorpayPayment({
                                orderId,
                                razorpay_order_id: rzpResponse.razorpay_order_id,
                                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                razorpay_signature: rzpResponse.razorpay_signature
                            });

                            if (verifyResp.data?.success) {
                                localStorage.removeItem('shippingInfo');
                                navigate(`/order-confirmation/${orderId}`);
                            } else {
                                setError(verifyResp.data?.error || 'Payment verification failed');
                            }
                        } catch (e) {
                            console.error('Razorpay verify failed:', e);
                            setError(e.response?.data?.error || 'Payment verification failed');
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setError('Payment was cancelled');
                            // Best-effort: cancel pending order and release reserved inventory
                            fetch('/api/payment/razorpay/cancel', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ orderId })
                            }).catch(() => {});
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (resp) {
                    setError(resp.error?.description || 'Payment failed');
                });
                rzp.open();
                return;
            }

            // Wallet/COD: existing behavior
            if (selectedPaymentMethod === 'wallet') {
                dispatch(fetchWalletData());
            }
            localStorage.removeItem('shippingInfo');
            const orderId = response.data.data.orderId;
            navigate(`/order-confirmation/${orderId}`);
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
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-teal-500 to-teal-600 rounded-full mb-4">
                            <span className="text-white text-2xl">💳</span>
                        </div> */}
                        <h1 className="text-5xl font-bold bg-linear-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-2">Payment</h1>
                        <p className="text-xl text-gray-600">Choose your preferred payment method</p>
                        <div className="w-24 h-1 bg-linear-to-r from-teal-500 to-teal-600 rounded-full mx-auto mt-4"></div>
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
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            Card details are entered securely in Razorpay Checkout after you click “Complete Payment”.
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
                                        <div className="text-sm text-gray-600">
                                            UPI payment happens in Razorpay Checkout after you click “Complete Payment”.
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
                            className="px-8 py-3 bg-linear-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
