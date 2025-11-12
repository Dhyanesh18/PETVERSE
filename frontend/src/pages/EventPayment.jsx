import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventPaymentData, processEventPayment, getWalletBalance } from '../services/api';
import { FaCheck, FaCreditCard, FaMobile, FaWallet, FaShieldAlt, FaCalendar, FaClock, FaMapMarker } from 'react-icons/fa';

const EventPayment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [wallet, setWallet] = useState({ balance: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('wallet');
    const [paymentDetails, setPaymentDetails] = useState({
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        upiId: ''
    });

    useEffect(() => {
        fetchPaymentData();
    }, [id]);

    const fetchPaymentData = async () => {
        try {
            setLoading(true);
            const response = await getEventPaymentData(id);
            const data = response.data.data;
            
            setEvent(data.event);
            setWallet(data.wallet);
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
            const response = await getWalletBalance();
            if (response.data && typeof response.data.balance === 'number') {
                setWallet({ balance: response.data.balance });
            }
        } catch (error) {
            console.warn('Failed to refresh wallet balance');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const selectPaymentMethod = (method) => {
        setSelectedMethod(method);
    };

    const validatePaymentDetails = () => {
        if (selectedMethod === 'credit-card') {
            const { cardName, cardNumber, expiryDate, cvv } = paymentDetails;
            const numRegex = /^\d{13,19}$/;
            const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
            const cvvRegex = /^\d{3,4}$/;

            if (!cardName.trim()) {
                alert('Please enter card holder name');
                return false;
            }
            if (!numRegex.test(cardNumber.replace(/\s+/g, ''))) {
                alert('Please enter a valid card number (13-19 digits)');
                return false;
            }
            if (!expRegex.test(expiryDate)) {
                alert('Please enter expiry date in MM/YY format');
                return false;
            }
            if (!cvvRegex.test(cvv)) {
                alert('Please enter a valid CVV (3-4 digits)');
                return false;
            }
        } else if (selectedMethod === 'upi') {
            const { upiId } = paymentDetails;
            const upiRegex = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
            if (!upiRegex.test(upiId.trim())) {
                alert('Please enter a valid UPI ID (e.g., yourname@upi)');
                return false;
            }
        } else if (selectedMethod === 'wallet') {
            if (wallet.balance < (event?.entryFee || 0)) {
                alert('Insufficient wallet balance');
                return false;
            }
        }
        return true;
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!validatePaymentDetails()) {
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                paymentMethod: selectedMethod,
                details: {}
            };

            if (selectedMethod === 'upi') {
                payload.details.upiId = paymentDetails.upiId.trim();
            } else if (selectedMethod === 'credit-card') {
                payload.details.cardName = paymentDetails.cardName.trim();
                payload.details.cardNumber = paymentDetails.cardNumber.replace(/\s+/g, '');
                payload.details.expiryDate = paymentDetails.expiryDate.trim();
                payload.details.cvv = paymentDetails.cvv.trim();
            }

            const response = await processEventPayment(id, payload);

            if (response.data.success) {
                navigate(response.data.data.redirectPath || `/events/${id}/ticket`);
            }
        } catch (error) {
            console.error('Payment failed:', error);
            alert(error.response?.data?.error || 'Payment failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700">Loading payment page...</p>
                </div>
            </div>
        );
    }

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
                                            <div className="mt-4 space-y-3 pl-8">
                                                <input
                                                    type="text"
                                                    name="cardName"
                                                    placeholder="Name on Card"
                                                    value={paymentDetails.cardName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                                <div className="grid grid-cols-3 gap-3">
                                                    <input
                                                        type="text"
                                                        name="cardNumber"
                                                        placeholder="Card Number"
                                                        value={paymentDetails.cardNumber}
                                                        onChange={handleInputChange}
                                                        maxLength="19"
                                                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="expiryDate"
                                                        placeholder="MM/YY"
                                                        value={paymentDetails.expiryDate}
                                                        onChange={handleInputChange}
                                                        maxLength="5"
                                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="cvv"
                                                        placeholder="CVV"
                                                        value={paymentDetails.cvv}
                                                        onChange={handleInputChange}
                                                        maxLength="4"
                                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    />
                                                </div>
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
                                            <div className="mt-4 pl-8">
                                                <input
                                                    type="text"
                                                    name="upiId"
                                                    placeholder="yourname@upi"
                                                    value={paymentDetails.upiId}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
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
                                                <div className="text-sm text-gray-600">Balance: ₹{wallet.balance.toFixed(2)}</div>
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
