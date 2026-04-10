import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEventPaymentData, processEventPayment, verifyEventRazorpayPayment, cancelEventRazorpayPayment } from '../services/api';
import { fetchWalletData } from '../redux/slices/walletSlice';
import { FaCheck, FaCreditCard, FaMobile, FaWallet, FaShieldAlt, FaCalendar, FaClock, FaMapMarker } from 'react-icons/fa';
import { EventPaymentSkeleton } from '../components/Skeleton';

const EventPayment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Redux state
    const { balance: walletBalance } = useSelector(state => state.wallet);
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('wallet');

    useEffect(() => {
        fetchPaymentData();
        // Fetch wallet balance on component mount
        dispatch(fetchWalletData());
    }, [id, dispatch]);

    const fetchPaymentData = async () => {
        try {
            setLoading(true);
            const response = await getEventPaymentData(id);
            const data = response.data.data;
            
            setEvent(data.event);
        } catch (error) {
            console.error('Failed to fetch payment data:', error);
            alert('Failed to load payment page');
            navigate(`/events/${id}`);
        } finally {
            setLoading(false);
        }
    };

    const refreshWalletBalance = async () => {
        try {
            await dispatch(fetchWalletData()).unwrap();
        } catch (error) {
            console.warn('Failed to refresh wallet balance');
        }
    };

    const selectPaymentMethod = (method) => {
        setSelectedMethod(method);
    };

    const validatePaymentDetails = () => {
        if (selectedMethod === 'wallet') {
            if (walletBalance < (event?.entryFee || 0)) {
                alert('Insufficient wallet balance');
                return false;
            }
        }
        return true;
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        let handedOffToRazorpay = false;

        if (!validatePaymentDetails()) {
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                paymentMethod: selectedMethod,
                details: {}
            };

            const response = await processEventPayment(id, payload);

            if (response.data.success) {
                // Wallet: immediate server-side payment
                if (selectedMethod === 'wallet') {
                    await dispatch(fetchWalletData()).unwrap();
                    navigate(response.data.data.redirectPath || `/events/${id}/ticket`);
                    return;
                }

                // Razorpay flow for card/UPI
                if ((selectedMethod === 'credit-card' || selectedMethod === 'upi') && response.data?.data?.razorpayOrderId) {
                    const {
                        intentId,
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
                        alert('Failed to load Razorpay. Please try again.');
                        return;
                    }

                    const options = {
                        key: keyId,
                        amount: amountPaise,
                        currency: currency || 'INR',
                        name: 'PetVerse',
                        description: 'Event Payment',
                        order_id: razorpayOrderId,
                        prefill: {
                            name: customer?.name || '',
                            email: customer?.email || '',
                            contact: customer?.contact || ''
                        },
                        notes: {
                            intentId
                        },
                        handler: async function (rzpResponse) {
                            try {
                                const verifyResp = await verifyEventRazorpayPayment(id, {
                                    intentId,
                                    razorpay_order_id: rzpResponse.razorpay_order_id,
                                    razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                    razorpay_signature: rzpResponse.razorpay_signature
                                });

                                if (verifyResp.data?.success) {
                                    navigate(verifyResp.data?.data?.redirectPath || `/events/${id}/ticket`);
                                } else {
                                    alert(verifyResp.data?.error || 'Payment verification failed');
                                }
                            } catch (e) {
                                alert(e.response?.data?.error || 'Payment verification failed');
                            } finally {
                                setSubmitting(false);
                            }
                        },
                        modal: {
                            ondismiss: function () {
                                cancelEventRazorpayPayment(id, { intentId }).catch(() => {});
                                setSubmitting(false);
                            }
                        }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (resp) {
                        alert(resp.error?.description || 'Payment failed');
                        setSubmitting(false);
                    });
                    handedOffToRazorpay = true;
                    rzp.open();
                    return;
                }

                navigate(response.data.data.redirectPath || `/events/${id}/ticket`);
            }
        } catch (error) {
            console.error('Payment failed:', error);
            alert(error.response?.data?.error || 'Payment failed. Please try again.');
        } finally {
            // For Razorpay we clear submitting in handler/ondismiss
            if (!handedOffToRazorpay) setSubmitting(false);
        }
    };

    if (loading) return <EventPaymentSkeleton />;

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-gray-700">Event not found</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 pt-20">
            <div className="max-w-6xl mx-auto px-4">
                {/* Progress Steps */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Event Payment</h1>
                    <div className="flex justify-between items-center relative">
                        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-300 -z-10"></div>
                        
                        <div className="flex flex-col items-center relative z-10">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mb-2">
                                <FaCheck />
                            </div>
                            <span className="text-sm font-semibold text-green-600">Register</span>
                        </div>

                        <div className="flex flex-col items-center relative z-10">
                            <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center mb-2">
                                2
                            </div>
                            <span className="text-sm font-semibold text-teal-600">Payment</span>
                        </div>

                        <div className="flex flex-col items-center relative z-10">
                            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center mb-2">
                                3
                            </div>
                            <span className="text-sm font-semibold text-gray-600">Ticket</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>

                            <form onSubmit={handlePayment}>
                                <div className="space-y-4 mb-6">
                                    {/* Credit/Debit Card */}
                                    <div
                                        onClick={() => selectPaymentMethod('credit-card')}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                                            selectedMethod === 'credit-card'
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-300 hover:border-teal-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="radio"
                                                name="payment-method"
                                                checked={selectedMethod === 'credit-card'}
                                                onChange={() => selectPaymentMethod('credit-card')}
                                                className="text-teal-500 focus:ring-teal-500"
                                            />
                                            <FaCreditCard className="text-2xl text-gray-600" />
                                            <div>
                                                <div className="font-semibold text-gray-800">Credit / Debit Card</div>
                                                <div className="text-sm text-gray-600">Pay securely with your card</div>
                                            </div>
                                        </div>

                                        {selectedMethod === 'credit-card' && (
                                            <div className="mt-4 pl-8 text-sm text-gray-600">
                                                Card details are entered securely in Razorpay Checkout after you click “Proceed Payment”.
                                            </div>
                                        )}
                                    </div>

                                    {/* UPI */}
                                    <div
                                        onClick={() => selectPaymentMethod('upi')}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                                            selectedMethod === 'upi'
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-300 hover:border-teal-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="radio"
                                                name="payment-method"
                                                checked={selectedMethod === 'upi'}
                                                onChange={() => selectPaymentMethod('upi')}
                                                className="text-teal-500 focus:ring-teal-500"
                                            />
                                            <FaMobile className="text-2xl text-gray-600" />
                                            <div>
                                                <div className="font-semibold text-gray-800">UPI</div>
                                                <div className="text-sm text-gray-600">Pay using UPI apps like Google Pay, PhonePe, Paytm</div>
                                            </div>
                                        </div>

                                        {selectedMethod === 'upi' && (
                                            <div className="mt-4 pl-8 text-sm text-gray-600">
                                                UPI details are entered securely in Razorpay Checkout after you click “Proceed Payment”.
                                            </div>
                                        )}
                                    </div>

                                    {/* Wallet */}
                                    <div
                                        onClick={() => selectPaymentMethod('wallet')}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                                            selectedMethod === 'wallet'
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-300 hover:border-teal-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="payment-method"
                                                checked={selectedMethod === 'wallet'}
                                                onChange={() => selectPaymentMethod('wallet')}
                                                className="text-teal-500 focus:ring-teal-500"
                                            />
                                            <FaWallet className="text-2xl text-green-600" />
                                            <div>
                                                <div className="font-semibold text-gray-800">PetVerse Wallet</div>
                                                <div className="text-sm text-gray-600">Balance: ₹{walletBalance?.toFixed(2) || '0.00'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/events/${id}`)}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-md transition duration-200"
                                    >
                                        Back to Event
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : 'Proceed Payment'}
                                    </button>
                                </div>

                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
                                    <FaShieldAlt />
                                    <span className="text-sm">Secure wallet payment</span>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Event Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Summary</h2>

                            <div className="mb-4">
                                <h3 className="font-bold text-gray-800 text-lg mb-2">{event.title}</h3>
                                <p className="text-sm text-gray-600 mb-1">Category: {event.category}</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p className="flex items-center gap-2">
                                        <FaCalendar className="text-teal-500" />
                                        {new Date(event.eventDate).toLocaleDateString()}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <FaClock className="text-teal-500" />
                                        {event.startTime} - {event.endTime}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <FaMapMarker className="text-teal-500" />
                                        {event.location?.venue}, {event.location?.city}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-700">
                                    <span>Entry Fee</span>
                                    <span className="font-semibold">₹{(event.entryFee || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>₹{(event.entryFee || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPayment;
