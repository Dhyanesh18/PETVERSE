import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletSkeleton } from '../components/Skeleton';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { 
    fetchWalletData, 
    transferMoneyFromWallet,
    clearError 
} from '../redux/slices/walletSlice';
import { createWalletTopupOrder, verifyWalletTopup, cancelWalletTopup, refundWalletTopup, getPaymentIntents } from '../services/api';
import { FaWallet, FaPlus, FaMinus, FaHistory, FaArrowLeft, FaRupeeSign, FaCreditCard, FaMobile, FaExchangeAlt, FaUniversity } from 'react-icons/fa';

const Wallet = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useAuth();
    
    // Redux state
    const { balance, transactions, gstInfo, loading, processing } = useSelector(state => state.wallet);
    
    // Local UI state
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [showTransferMoney, setShowTransferMoney] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferType, setTransferType] = useState('bank'); // 'bank' or 'upi'
    const [transferDetails, setTransferDetails] = useState({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        upiId: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [topupProcessing, setTopupProcessing] = useState(false);
    const [topupIntents, setTopupIntents] = useState([]);
    const [topupIntentsLoading, setTopupIntentsLoading] = useState(false);
    const [topupRefundProcessingId, setTopupRefundProcessingId] = useState(null);
    const [addAmountTouched, setAddAmountTouched] = useState(false);
    const [transferTouched, setTransferTouched] = useState({
        amount: false,
        accountHolderName: false,
        accountNumber: false,
        ifscCode: false,
        bankName: false,
        upiId: false
    });

    const availableBalance = Number(balance) || 0;

    const addAmountError = (() => {
        const amt = Number(addAmount);
        if (!addAmount) return 'Amount is required';
        if (Number.isNaN(amt) || amt <= 0) return 'Enter a valid amount';
        return '';
    })();

    const computeTransferErrors = (amountValue, typeValue, detailsValue) => {
        const nextErrors = {
            amount: '',
            accountHolderName: '',
            accountNumber: '',
            ifscCode: '',
            bankName: '',
            upiId: ''
        };

        const amt = Number(amountValue);
        if (!amountValue) {
            nextErrors.amount = 'Amount is required';
        } else if (Number.isNaN(amt) || amt <= 0) {
            nextErrors.amount = 'Enter a valid amount';
        } else if (amt > availableBalance) {
            nextErrors.amount = 'Insufficient balance in wallet';
        }

        if (typeValue === 'bank') {
            if (!detailsValue.accountHolderName?.trim()) {
                nextErrors.accountHolderName = 'Account holder name is required';
            }

            const acct = (detailsValue.accountNumber || '').replace(/\s+/g, '');
            if (!acct) {
                nextErrors.accountNumber = 'Account number is required';
            } else if (!/^\d{9,18}$/.test(acct)) {
                nextErrors.accountNumber = 'Enter a valid account number';
            }

            const ifsc = (detailsValue.ifscCode || '').trim().toUpperCase();
            if (!ifsc) {
                nextErrors.ifscCode = 'IFSC code is required';
            } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
                nextErrors.ifscCode = 'Enter a valid IFSC code';
            }
        } else {
            const upi = (detailsValue.upiId || '').trim();
            if (!upi) {
                nextErrors.upiId = 'UPI ID is required';
            } else if (!/^[^\s@]+@[^\s@]+$/.test(upi)) {
                nextErrors.upiId = 'Enter a valid UPI ID (e.g., user@bank)';
            }
        }

        return nextErrors;
    };

    const transferErrors = computeTransferErrors(transferAmount, transferType, transferDetails);
    const hasTransferErrors = Object.values(transferErrors).some(Boolean);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        // Fetch wallet data on component mount
        dispatch(fetchWalletData());

        // Fetch recent top-up intents for refund UI
        fetchTopupIntents();
        
        // Refetch wallet data when user returns to this page
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                dispatch(fetchWalletData());
            }
        };
        
        const handleFocus = () => {
            dispatch(fetchWalletData());
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isAuthenticated, navigate, dispatch]);

    const fetchTopupIntents = async () => {
        try {
            setTopupIntentsLoading(true);
            const resp = await getPaymentIntents({ purpose: 'wallet_topup', limit: 10 });
            const intents = resp.data?.data?.intents || [];
            setTopupIntents(intents);
        } catch {
            // Non-blocking
            setTopupIntents([]);
        } finally {
            setTopupIntentsLoading(false);
        }
    };

    // Clear errors when component unmounts
    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleAddMoney = async () => {
        setAddAmountTouched(true);
        if (addAmountError) return;

        try {
            setTopupProcessing(true);

            const resp = await createWalletTopupOrder({
                amount: parseFloat(addAmount),
                paymentMethod
            });

            if (!resp.data?.success) {
                alert(resp.data?.error || 'Failed to create payment order');
                setTopupProcessing(false);
                return;
            }

            const {
                intentId,
                razorpayOrderId,
                amountPaise,
                currency,
                keyId,
                customer
            } = resp.data.data;

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
                setTopupProcessing(false);
                return;
            }

            const options = {
                key: keyId,
                amount: amountPaise,
                currency: currency || 'INR',
                name: 'PetVerse',
                description: 'Wallet Top-up',
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
                        const verifyResp = await verifyWalletTopup({
                            intentId,
                            razorpay_order_id: rzpResponse.razorpay_order_id,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_signature: rzpResponse.razorpay_signature
                        });

                        if (verifyResp.data?.success) {
                            alert('Money added successfully!');
                            setShowAddMoney(false);
                            setAddAmount('');
                            dispatch(fetchWalletData());
                            fetchTopupIntents();
                        } else {
                            alert(verifyResp.data?.error || 'Payment verification failed');
                        }
                    } catch (e) {
                        alert(e.response?.data?.error || 'Payment verification failed');
                    } finally {
                        setTopupProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        cancelWalletTopup({ intentId }).catch(() => {});
                        setTopupProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                alert(resp.error?.description || 'Payment failed');
                setTopupProcessing(false);
            });
            rzp.open();
        } catch (error) {
            alert(error.response?.data?.error || error.message || 'Failed to add money. Please try again.');
            setTopupProcessing(false);
        }
    };

    const handleTransferMoney = async () => {
        const nextTouched = {
            amount: true,
            accountHolderName: transferType === 'bank',
            accountNumber: transferType === 'bank',
            ifscCode: transferType === 'bank',
            bankName: false,
            upiId: transferType === 'upi'
        };
        setTransferTouched(nextTouched);

        const currentErrors = computeTransferErrors(transferAmount, transferType, transferDetails);
        if (Object.values(currentErrors).some(Boolean)) return;

        try {
            await dispatch(transferMoneyFromWallet({
                amount: parseFloat(transferAmount),
                transferType,
                transferDetails: transferType === 'bank' ? {
                    accountHolderName: transferDetails.accountHolderName,
                    accountNumber: transferDetails.accountNumber,
                    ifscCode: transferDetails.ifscCode,
                    bankName: transferDetails.bankName
                } : {
                    upiId: transferDetails.upiId
                }
            })).unwrap();
            
            alert(`Transfer of ₹${transferAmount} initiated successfully!`);
            setShowTransferMoney(false);
            setTransferAmount('');
            setTransferDetails({
                accountHolderName: '',
                accountNumber: '',
                ifscCode: '',
                bankName: '',
                upiId: ''
            });
            // Refresh wallet data
            dispatch(fetchWalletData());
        } catch (error) {
            alert(error || 'Failed to transfer money. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const handleRefundTopup = async (intentId) => {
        if (!intentId) return;
        const ok = window.confirm('Refund this wallet top-up back to the original payment method?');
        if (!ok) return;

        try {
            setTopupRefundProcessingId(intentId);
            const resp = await refundWalletTopup({ intentId });
            if (resp.data?.success) {
                alert('Refund initiated. It may take time to reflect in your bank/app.');
                dispatch(fetchWalletData());
                fetchTopupIntents();
            } else {
                alert(resp.data?.error || 'Refund failed');
            }
        } catch (e) {
            alert(e.response?.data?.error || 'Refund failed');
        } finally {
            setTopupRefundProcessingId(null);
        }
    };


    if (loading) return <WalletSkeleton />;

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-2">
                        My Wallet
                    </h1>
                    <p className="text-xl text-gray-600">Manage your wallet balance and transactions</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mx-auto mt-4"></div>
                </div>

                {/* Wallet Balance Card */}
                <div className="max-w-4xl mx-auto">
                    {user?.role === 'admin' ? (
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaWallet className="text-3xl" />
                                        <h2 className="text-2xl font-bold">Admin Revenue & GST Summary</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-40">
                                            <p className="text-gray-900 font-semibold text-sm mb-2">Total Commission Revenue</p>
                                            <div className="text-3xl font-bold text-gray-900">
                                                ₹{gstInfo.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                            </div>
                                        </div>
                                        <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-40">
                                            <p className="text-gray-900 font-semibold text-sm mb-2">GST Liability (18%)</p>
                                            <div className="text-3xl font-bold text-gray-900">
                                                ₹{gstInfo.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                            </div>
                                        </div>
                                        <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-40">
                                            <p className="text-gray-900 font-semibold text-sm mb-2">Net Revenue (After GST)</p>
                                            <div className="text-3xl font-bold text-gray-900">
                                                ₹{gstInfo.netRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaWallet className="text-3xl" />
                                        <h2 className="text-2xl font-bold">Wallet Balance</h2>
                                    </div>
                                    <div className="text-5xl font-bold mb-2">
                                        ₹{balance?.toLocaleString('en-IN') || '0'}
                                    </div>
                                    <p className="text-teal-100">Available Balance</p>
                                </div>
                                <div className="text-right">
                                    <button
                                        onClick={() => setShowAddMoney(true)}
                                        className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                                    >
                                        <FaPlus /> Add Money
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <FaPlus className="text-green-600 text-xl" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Add Money</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">Add money to your wallet using card or UPI</p>
                            <button
                                onClick={() => setShowAddMoney(true)}
                                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Add Funds
                            </button>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <FaExchangeAlt className="text-orange-600 text-xl" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Withdraw Money</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">Transfer to bank account or UPI</p>
                            <button
                                onClick={() => setShowTransferMoney(true)}
                                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Withdraw
                            </button>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FaHistory className="text-blue-600 text-xl" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Transaction History</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">View all your wallet transactions</p>
                            <button
                                onClick={() => document.getElementById('transactions').scrollIntoView({ behavior: 'smooth' })}
                                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                View History
                            </button>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <FaRupeeSign className="text-purple-600 text-xl" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Secure Payments</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">Safe and secure payment processing</p>
                            <div className="w-full bg-purple-500 text-white py-2 rounded-lg text-center">
                                100% Secure
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div id="transactions" className="bg-white rounded-xl shadow-md border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <FaHistory className="text-2xl text-gray-600" />
                                <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            {transactions && transactions.length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.map((transaction, index) => {
                                        // Determine transaction title based on type and credit/debit
                                        let title = transaction.description || 'Transaction';
                                        let subtitle = '';
                                        
                                        // Add more context based on transaction type
                                        if (transaction.otherUser && transaction.otherUser.name) {
                                            // Check if it's a GST transaction
                                            if (transaction.isGST || transaction.otherUser.name === 'GST') {
                                                subtitle = transaction.isCredit ? 
                                                    `From: GST` : 
                                                    `To: GST`;
                                            } else {
                                                subtitle = transaction.isCredit ? 
                                                    `From: ${transaction.otherUser.name}` : 
                                                    `To: ${transaction.otherUser.name}`;
                                            }
                                        }

                                        return (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                                                        transaction.isGST || transaction.otherUser?.name === 'GST' 
                                                            ? 'bg-purple-100' 
                                                            : 'bg-white'
                                                    }`}>
                                                        {transaction.isCredit ? 
                                                            <FaPlus className={transaction.isGST || transaction.otherUser?.name === 'GST' ? 'text-purple-600' : 'text-green-600'} /> : 
                                                            <FaMinus className={transaction.isGST || transaction.otherUser?.name === 'GST' ? 'text-purple-600' : 'text-red-600'} />
                                                        }
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">
                                                            {title}
                                                        </h4>
                                                        {subtitle && (
                                                            <p className={`text-sm ${
                                                                transaction.isGST || transaction.otherUser?.name === 'GST' 
                                                                    ? 'text-purple-600 font-medium' 
                                                                    : 'text-gray-600'
                                                            }`}>
                                                                {subtitle}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            {transaction.createdAt ? formatDate(transaction.createdAt) : 'Unknown date'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${
                                                        transaction.isGST || transaction.otherUser?.name === 'GST' 
                                                            ? 'text-purple-600' 
                                                            : transaction.isCredit ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {transaction.isCredit ? '+' : '-'}
                                                        ₹{transaction.amount?.toLocaleString('en-IN') || '0'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Yet</h3>
                                    <p className="text-gray-500">Your transaction history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Top-ups (Refund) */}
                    {user?.role !== 'admin' && (
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 mt-8">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <FaPlus className="text-2xl text-green-600" />
                                    <h2 className="text-2xl font-bold text-gray-800">Recent Top-ups</h2>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Refund a top-up back to the original payment method.</p>
                            </div>

                            <div className="p-6">
                                {topupIntentsLoading ? (
                                    <div className="text-gray-600">Loading...</div>
                                ) : (topupIntents && topupIntents.length > 0) ? (
                                    <div className="space-y-3">
                                        {topupIntents.map((i) => (
                                            <div key={i._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <div className="font-semibold text-gray-800">₹{Number(i.amount || 0).toLocaleString('en-IN')}</div>
                                                    <div className="text-xs text-gray-500">{i.createdAt ? formatDate(i.createdAt) : ''}</div>
                                                    <div className="text-xs text-gray-600">Status: {i.status}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {i.status === 'paid' && (
                                                        <button
                                                            onClick={() => handleRefundTopup(i._id)}
                                                            disabled={topupRefundProcessingId === i._id}
                                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                                                        >
                                                            {topupRefundProcessingId === i._id ? 'Refunding...' : 'Refund'}
                                                        </button>
                                                    )}
                                                    {i.status === 'refunded' && (
                                                        <div className="text-sm font-semibold text-green-700">Refunded</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-600">No top-ups found.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Money Modal */}
                {showAddMoney && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Add Money</h3>
                                <button
                                    onClick={() => setShowAddMoney(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount to Add
                                    </label>
                                    <div className="relative">
                                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={addAmount}
                                            onChange={(e) => setAddAmount(e.target.value)}
                                            onBlur={() => setAddAmountTouched(true)}
                                            placeholder="Enter amount"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            min="1"
                                        />
                                    </div>
                                    {addAmountTouched && addAmountError && (
                                        <p className="mt-2 text-sm text-red-600">{addAmountError}</p>
                                    )}
                                </div>

                                {/* Payment Method Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                                paymentMethod === 'card'
                                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            <FaCreditCard />
                                            Card
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('upi')}
                                            className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                                paymentMethod === 'upi'
                                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            <FaMobile />
                                            UPI
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                                    Your {paymentMethod === 'card' ? 'card' : 'UPI'} details are entered securely in Razorpay Checkout after you click “Add Money”.
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowAddMoney(false)}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMoney}
                                        disabled={topupProcessing || !!addAmountError}
                                        className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {topupProcessing ? 'Processing...' : 'Add Money'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Money Modal */}
                {showTransferMoney && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Withdraw Money</h3>
                                <button
                                    onClick={() => setShowTransferMoney(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-teal-800">
                                    <strong>Available Balance:</strong> ₹{balance?.toLocaleString('en-IN') || '0'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount to Withdraw
                                    </label>
                                    <div className="relative">
                                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            onBlur={() => setTransferTouched(prev => ({ ...prev, amount: true }))}
                                            placeholder="Enter amount"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            min="1"
                                            max={availableBalance}
                                        />
                                    </div>
                                    {transferTouched.amount && transferErrors.amount && (
                                        <p className="mt-2 text-sm text-red-600">{transferErrors.amount}</p>
                                    )}
                                </div>

                                {/* Transfer Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Withdraw To
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setTransferType('bank')}
                                            className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                                transferType === 'bank'
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            <FaUniversity />
                                            Bank Account
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransferType('upi')}
                                            className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                                transferType === 'upi'
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            <FaMobile />
                                            UPI
                                        </button>
                                    </div>
                                </div>

                                {/* Transfer Details */}
                                {transferType === 'bank' ? (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Account Holder Name"
                                            value={transferDetails.accountHolderName}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                            onBlur={() => setTransferTouched(prev => ({ ...prev, accountHolderName: true }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        {transferTouched.accountHolderName && transferErrors.accountHolderName && (
                                            <p className="-mt-2 text-sm text-red-600">{transferErrors.accountHolderName}</p>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Account Number"
                                            value={transferDetails.accountNumber}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                                            onBlur={() => setTransferTouched(prev => ({ ...prev, accountNumber: true }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        {transferTouched.accountNumber && transferErrors.accountNumber && (
                                            <p className="-mt-2 text-sm text-red-600">{transferErrors.accountNumber}</p>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="IFSC Code"
                                            value={transferDetails.ifscCode}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                                            onBlur={() => setTransferTouched(prev => ({ ...prev, ifscCode: true }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        {transferTouched.ifscCode && transferErrors.ifscCode && (
                                            <p className="-mt-2 text-sm text-red-600">{transferErrors.ifscCode}</p>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Bank Name (Optional)"
                                            value={transferDetails.bankName}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, bankName: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-700">
                                                <strong>Note:</strong> Bank transfers usually take 1-3 business days to process.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="UPI ID (e.g., user@paytm)"
                                            value={transferDetails.upiId}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, upiId: e.target.value }))}
                                            onBlur={() => setTransferTouched(prev => ({ ...prev, upiId: true }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        {transferTouched.upiId && transferErrors.upiId && (
                                            <p className="-mt-2 text-sm text-red-600">{transferErrors.upiId}</p>
                                        )}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-700">
                                                <strong>Note:</strong> UPI withdrawals are processed instantly to your registered UPI ID.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowTransferMoney(false)}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleTransferMoney}
                                        disabled={processing || hasTransferErrors}
                                        className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Processing...' : 'Withdraw Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;
