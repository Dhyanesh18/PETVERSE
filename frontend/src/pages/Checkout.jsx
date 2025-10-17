import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const Checkout = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [cart, setCart] = useState({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 });
    const [wallet, setWallet] = useState({ balance: 0 });
    
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('wallet');

    useEffect(() => {
        fetchCheckoutData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCheckoutData = async () => {
        try {
            // Fetch cart data
            const cartResponse = await fetch('/api/cart', {
                credentials: 'include'
            });
            
            if (cartResponse.ok) {
                const cartData = await cartResponse.json();
                if (cartData.success && cartData.cart) {
                    calculateCartTotals(cartData.cart);
                }
            }

            // Fetch wallet balance
            const walletResponse = await fetch('/api/wallet', {
                credentials: 'include'
            });
            
            if (walletResponse.ok) {
                const walletData = await walletResponse.json();
                setWallet(walletData);
            }

        } catch (err) {
            setError('Failed to load checkout data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateCartTotals = (cartData) => {
        let subtotal = 0;
        const processedItems = [];

        if (cartData.items && cartData.items.length > 0) {
            cartData.items.forEach(item => {
                if (item.productId) {
                    const product = item.productId;
                    const price = product.discount > 0
                        ? product.price * (1 - product.discount / 100)
                        : product.price;
                    
                    const itemTotal = price * item.quantity;
                    subtotal += itemTotal;

                    processedItems.push({
                        ...item,
                        displayPrice: price,
                        itemTotal: itemTotal,
                        name: product.name,
                        image: product.images?.[0] ? 
                            `data:${product.images[0].contentType};base64,${product.images[0].data}` : 
                            '/images/default-product.jpg'
                    });
                }
            });
        }

        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.10; // 10% tax
        const total = subtotal + shipping + tax;

        setCart({
            items: processedItems,
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            total: total
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateShippingInfo = () => {
        const required = ['fullName', 'address', 'city', 'state', 'zipCode', 'phone'];
        for (const field of required) {
            if (!shippingInfo[field].trim()) {
                setError(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
                return false;
            }
        }
        return true;
    };

    const handleCheckout = async () => {
        if (!validateShippingInfo()) {
            return;
        }

        if (cart.items.length === 0) {
            setError('Your cart is empty');
            return;
        }

        if (paymentMethod === 'wallet' && wallet.balance < cart.total) {
            setError('Insufficient wallet balance. Please add funds to your wallet.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // First submit shipping info
            const checkoutResponse = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(shippingInfo)
            });

            if (!checkoutResponse.ok) {
                const errorData = await checkoutResponse.json();
                throw new Error(errorData.error || 'Checkout failed');
            }

            // Then process payment
            const paymentResponse = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ paymentMethod })
            });

            const paymentData = await paymentResponse.json();

            if (paymentData.success) {
                // Redirect to order confirmation with order ID
                navigate(`/order-confirmation?orderId=${paymentData.orderId}`);
            } else {
                setError(paymentData.message || 'Payment failed');
            }

        } catch (err) {
            setError('Checkout failed: ' + err.message);
        } finally {
            setSubmitting(false);
        }
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Shipping & Payment */}
                        <div className="space-y-6">
                            {/* Shipping Information */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
                                
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
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
                                        rows="3"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Street address, apartment, suite, etc."
                                    />
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                                
                                <div className="space-y-3">
                                    <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="wallet"
                                            checked={paymentMethod === 'wallet'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">Wallet Payment</div>
                                            <div className="text-sm text-gray-600">
                                                Current Balance: ₹{wallet.balance?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 opacity-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            disabled
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">Cash on Delivery</div>
                                            <div className="text-sm text-gray-600">Coming Soon</div>
                                        </div>
                                    </label>
                                </div>

                                {paymentMethod === 'wallet' && wallet.balance < cart.total && (
                                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                                        Insufficient wallet balance. You need ₹{(cart.total - wallet.balance).toFixed(2)} more.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                            
                            {/* Cart Items */}
                            <div className="space-y-4 mb-6">
                                {cart.items.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                                ) : (
                                    cart.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-medium">{item.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Qty: {item.quantity} × ₹{item.displayPrice?.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="font-medium">
                                                ₹{item.itemTotal?.toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Order Totals */}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{cart.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span>{cart.shipping === 0 ? 'Free' : `₹${cart.shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (10%):</span>
                                    <span>₹{cart.tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                                    <span>Total:</span>
                                    <span>₹{cart.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Place Order Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={submitting || cart.items.length === 0}
                                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Processing...' : `Place Order - ₹${cart.total.toFixed(2)}`}
                            </button>

                            <div className="mt-4 text-sm text-gray-500 text-center">
                                {cart.subtotal >= 500 && (
                                    <p className="text-green-600">🎉 Free shipping on orders over ₹500!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;