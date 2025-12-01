import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaWallet, FaPlus, FaMinus, FaHistory, FaArrowLeft, FaRupeeSign, FaCreditCard, FaMobile, FaExchangeAlt, FaUniversity } from 'react-icons/fa';

const Wallet = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [walletData, setWalletData] = useState({
        balance: 0,
        transactions: []
    });
    const [loading, setLoading] = useState(true);
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
    const [paymentDetails, setPaymentDetails] = useState({
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        upiId: ''
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchWalletData();
    }, [isAuthenticated, navigate]);

    const fetchWalletData = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/user/wallet', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setWalletData(data.data);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoney = async () => {
        if (!addAmount || parseFloat(addAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setProcessing(true);
        try {
            const requestData = {
                amount: parseFloat(addAmount),
                paymentMethod,
                paymentDetails: paymentMethod === 'card' ? paymentDetails : { upiId: paymentDetails.upiId }
            };

            const response = await fetch('http://localhost:8080/api/user/wallet/add-money', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Money added successfully!');
                setShowAddMoney(false);
                setAddAmount('');
                setPaymentDetails({
                    cardName: '',
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    upiId: ''
                });
                fetchWalletData(); 
            } else {
                alert(data.error || 'Failed to add money');
            }
        } catch (error) {
            console.error('Error adding money:', error);
            alert('Failed to add money. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleTransferMoney = async () => {
        if (!transferAmount || parseFloat(transferAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (parseFloat(transferAmount) > walletData.balance) {
            alert('Insufficient balance in wallet');
            return;
        }

        // Validate based on transfer type
        if (transferType === 'bank') {
            if (!transferDetails.accountHolderName || !transferDetails.accountNumber || !transferDetails.ifscCode) {
                alert('Please fill in all bank account details');
                return;
            }
        } else {
            if (!transferDetails.upiId) {
                alert('Please provide UPI ID');
                return;
            }
        }

        setProcessing(true);
        try {
            const requestData = {
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
            };

            const response = await fetch('http://localhost:8080/api/user/wallet/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            
            if (data.success) {
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
                fetchWalletData(); // Refresh wallet data
            } else {
                alert(data.error || 'Failed to transfer money');
            }
        } catch (error) {
            console.error('Error transferring money:', error);
            alert('Failed to transfer money. Please try again.');
        } finally {
            setProcessing(false);
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


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading wallet...</div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <FaWallet className="text-3xl" />
                                    <h2 className="text-2xl font-bold">Wallet Balance</h2>
                                </div>
                                <div className="text-5xl font-bold mb-2">
                                    ₹{walletData.balance?.toLocaleString('en-IN') || '0'}
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
                            {walletData.transactions && walletData.transactions.length > 0 ? (
                                <>
                                    {/* Transaction Summary */}
                                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Total Credits</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    +₹{walletData.transactions
                                                        .filter(t => t.isCredit)
                                                        .reduce((sum, t) => sum + (t.amount || 0), 0)
                                                        .toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Total Debits</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    -₹{walletData.transactions
                                                        .filter(t => !t.isCredit)
                                                        .reduce((sum, t) => sum + (t.amount || 0), 0)
                                                        .toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Net (Shown)</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    ₹{(walletData.transactions
                                                        .filter(t => t.isCredit)
                                                        .reduce((sum, t) => sum + (t.amount || 0), 0) -
                                                    walletData.transactions
                                                        .filter(t => !t.isCredit)
                                                        .reduce((sum, t) => sum + (t.amount || 0), 0))
                                                        .toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                                                <p className="text-lg font-bold text-purple-600">
                                                    {walletData.transactions.length}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 text-center mt-3">
                                            Showing last 50 transactions. Your balance includes all historical transactions.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                    {walletData.transactions.map((transaction, index) => {
                                        // Determine transaction title based on type and credit/debit
                                        let title = transaction.description || 'Transaction';
                                        let subtitle = '';
                                        
                                        // Add more context based on transaction type
                                        if (transaction.otherUser && transaction.otherUser.name) {
                                            subtitle = transaction.isCredit ? 
                                                `From: ${transaction.otherUser.name}` : 
                                                `To: ${transaction.otherUser.name}`;
                                        }

                                        return (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                        {transaction.isCredit ? 
                                                            <FaPlus className="text-green-600" /> : 
                                                            <FaMinus className="text-red-600" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">
                                                            {title}
                                                        </h4>
                                                        {subtitle && (
                                                            <p className="text-sm text-gray-600">
                                                                {subtitle}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            {transaction.createdAt ? formatDate(transaction.createdAt) : 'Unknown date'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${transaction.isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {transaction.isCredit ? '+' : '-'}
                                                        ₹{transaction.amount?.toLocaleString('en-IN') || '0'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Yet</h3>
                                    <p className="text-gray-500">Your transaction history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
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
                                            placeholder="Enter amount"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Payment Method Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
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
                                {paymentMethod === 'card' ? (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Cardholder Name"
                                            value={paymentDetails.cardName}
                                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardName: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Card Number"
                                            value={paymentDetails.cardNumber}
                                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={paymentDetails.expiryDate}
                                                onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                placeholder="CVV"
                                                value={paymentDetails.cvv}
                                                onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="UPI ID (e.g., user@paytm)"
                                            value={paymentDetails.upiId}
                                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, upiId: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

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
                                        disabled={processing}
                                        className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Processing...' : 'Add Money'}
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
                                    <strong>Available Balance:</strong> ₹{walletData.balance?.toLocaleString('en-IN') || '0'}
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
                                            placeholder="Enter amount"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            min="1"
                                            max={walletData.balance}
                                        />
                                    </div>
                                </div>

                                {/* Transfer Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Withdraw To
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Account Number"
                                            value={transferDetails.accountNumber}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <input
                                            type="text"
                                            placeholder="IFSC Code"
                                            value={transferDetails.ifscCode}
                                            onChange={(e) => setTransferDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
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
                                        disabled={processing}
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
