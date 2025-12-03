import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import Header from '../components/Header';

const OrderDetails = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { user } = useAuth();

    const getDashboardUrl = () => {
        if (!user) return '/home';
        switch (user.role) {
            case 'owner':
                return '/dashboard';
            case 'seller':
                return '/seller/dashboard';
            case 'service-provider':
                return '/service-provider/dashboard';
            case 'admin':
                return '/admin/dashboard';
            default:
                return '/home';
        }
    };
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [requestingRefund, setRequestingRefund] = useState(false);

    const fetchOrderDetails = useCallback(async () => {
        try {
            // Determine API endpoint based on user role
            let apiEndpoint;
            if (user?.role === 'admin') {
                apiEndpoint = `/api/admin/orders/${orderId}`;
            } else if (user?.role === 'seller') {
                apiEndpoint = `/api/seller/orders/${orderId}`;
            } else {
                apiEndpoint = `/api/user/orders/${orderId}`;
            }
            
            const response = await fetch(apiEndpoint, {
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log('Order API Response:', data); // Debug log
            
            if (data.success) {
                // Handle different response structures
                const orderData = data.data?.order || data.order || data.data;
                console.log('Processed order data:', orderData); // Debug log
                console.log('Customer data:', orderData.customer); // Debug customer
                console.log('Shipping address:', orderData.shippingAddress); // Debug shipping
                setOrder(orderData);
            } else {
                setError(data.error || 'Failed to load order details');
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('Error loading order details');
        } finally {
            setLoading(false);
        }
    }, [orderId, user?.role]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);

    const updateOrderStatus = async (newStatus) => {
        // Only sellers and admins can update order status
        if (user?.role !== 'seller' && user?.role !== 'admin') {
            showToast('You do not have permission to update order status');
            return;
        }

        if (newStatus === order.status) {
            showToast('Status is already ' + newStatus);
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch(`/api/seller/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                setOrder(prev => ({ ...prev, status: newStatus }));
                showToast('Order status updated successfully!');
            } else {
                setError(data.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const showToast = (message) => {
        // Simple alert for now, can be replaced with a proper toast library
        alert(message);
    };

    const handleRefundRequest = async () => {
        if (order.status === 'cancelled') {
            showToast('This order is already cancelled');
            return;
        }

        const reason = window.prompt('Please enter the reason for refund request:');
        if (!reason) {
            return; // User cancelled
        }

        setRequestingRefund(true);
        try {
            const apiEndpoint = user?.role === 'seller' 
                ? `/api/seller/orders/${orderId}/request-refund`
                : `/api/user/orders/${orderId}/request-refund`;

            const response = await axios.post(apiEndpoint, { reason }, {
                withCredentials: true
            });

            if (response.data.success) {
                showToast('Refund request submitted successfully! Admin will review it soon.');
            } else {
                showToast(response.data.error || 'Failed to submit refund request');
            }
        } catch (err) {
            console.error('Error requesting refund:', err);
            showToast(err.response?.data?.error || 'Failed to submit refund request');
        } finally {
            setRequestingRefund(false);
        }
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            'pending': 'fas fa-clock',
            'processing': 'fas fa-spinner',
            'shipped': 'fas fa-shipping-fast',
            'delivered': 'fas fa-check-circle',
            'cancelled': 'fas fa-times-circle'
        };
        return iconMap[status] || 'fas fa-clock';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Order</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button 
                            onClick={() => navigate(getDashboardUrl())}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
                        <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                        <button 
                            onClick={() => navigate(getDashboardUrl())}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ paddingTop: '6rem' }}>
                {/* Order Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 animate-fade-in">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-100">
                        <div>
                            <h1 className="text-3xl font-bold text-teal-600 mb-2">Order Details</h1>
                            <div className="text-gray-500 text-sm font-medium">
                                Order #{order._id?.substring(0, 8) || order.or}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm shadow-md animate-pulse ${
                                order.status === 'pending' ? 'bg-linear-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-2 border-yellow-400' :
                                order.status === 'processing' ? 'bg-linear-to-r from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-400' :
                                order.status === 'shipped' ? 'bg-linear-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-400' :
                                order.status === 'delivered' ? 'bg-linear-to-r from-green-100 to-green-300 text-green-800 border-2 border-green-400' :
                                'bg-linear-to-r from-red-100 to-red-200 text-red-800 border-2 border-red-400'
                            }`}>
                                <i className={getStatusIcon(order.status)}></i>
                                <span>{order.status?.charAt(0)?.toUpperCase() + order.status?.slice(1)}</span>
                            </div>
                            
                            {/* Status Update Form - Only for Sellers and Admins */}
                            {(user?.role === 'seller' || user?.role === 'admin') && (
                                <div className="flex gap-2 items-center">
                                    <select 
                                        value={order.status || 'pending'}
                                        onChange={(e) => updateOrderStatus(e.target.value)}
                                        disabled={updating}
                                        className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white font-medium cursor-pointer transition-all focus:outline-none focus:border-teal-500 focus:shadow-lg"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    {updating && (
                                        <div className="text-teal-600">
                                            <i className="fas fa-spinner fa-spin"></i>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i className="fas fa-user text-teal-600"></i> Customer Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">Name</div>
                                    <div className="text-gray-800 font-medium">
                                        {order.customer?.fullName || order.customer?.name || order.customer?._id || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                                    <div className="text-gray-800">{order.customer?.email || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">Phone</div>
                                    <div className="text-gray-800 flex items-center gap-2">
                                        {order.customer?.phoneNo || order.customer?.phone || order.customer?.mobile || order.shippingAddress?.phone || order.shippingAddress?.phoneNo || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">Delivery Address</div>
                                    <div className="text-gray-800">
                                        {order.shippingAddress && (order.shippingAddress.street || order.shippingAddress.city || order.shippingAddress.state) ? (
                                            <div className="space-y-1">
                                                {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                                                {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.zipCode) && (
                                                    <div>
                                                        {order.shippingAddress.city && `${order.shippingAddress.city}`}
                                                        {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                                                        {order.shippingAddress.zipCode && ` - ${order.shippingAddress.zipCode}`}
                                                    </div>
                                                )}
                                                {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                                                {(order.shippingAddress.phone || order.shippingAddress.mobile || order.shippingAddress.phoneNo) && (
                                                    <div className="text-sm text-gray-600 mt-2">
                                                        <i className="fas fa-phone text-gray-400 mr-1"></i>
                                                        {order.shippingAddress.phone || order.shippingAddress.mobile || order.shippingAddress.phoneNo}
                                                    </div>
                                                )}
                                            </div>
                                        ) : order.customer?.address ? (
                                            <div>{order.customer.address}</div>
                                        ) : order.customer?.fullAddress ? (
                                            <div>{order.customer.fullAddress}</div>
                                        ) : (
                                            <div className="text-gray-400 italic">No delivery address provided</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seller Information - Only for Admin */}
                    {user?.role === 'admin' && order.seller && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <i className="fas fa-store text-green-600"></i> Seller Information
                            </h2>
                            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">Seller Name</div>
                                            <div className="text-gray-800 font-medium">
                                                {order.seller?.name || order.seller?.fullName || order.seller?.businessName || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                                            <div className="text-gray-800">{order.seller?.email || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">Seller ID</div>
                                            <div className="text-gray-800 font-mono text-sm">
                                                {order.seller?._id || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i className="fas fa-box text-teal-600"></i> Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items?.map((item, index) => {
                                console.log('Order item:', item); // Debug log
                                return (
                                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                            {item.product?._id ? (
                                                <img 
                                                    src={`/api/images/product/${item.product._id}/0`}
                                                    alt={item.product?.name || 'Product'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.log('Image failed to load for product:', item.product._id);
                                                        e.target.src = '/images/default-product.jpg';
                                                    }}
                                                    onLoad={() => {
                                                        console.log('Image loaded successfully for product:', item.product._id);
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                                    <i className="fas fa-box text-gray-500 text-xl"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grow">
                                            <div className="font-semibold text-gray-800 text-lg">
                                                {item.product?.name || item.name || `Product (ID: ${item.product?._id?.slice(-6) || item._id?.slice(-6) || 'Unknown'})`}
                                            </div>
                                            {item.product?.description && (
                                                <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {item.product.description}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                                    Quantity: <span className="font-semibold">{item.quantity}</span>
                                                </div>
                                                <div className="text-lg font-bold text-teal-600">
                                                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                                </div>
                                            </div>
                                            {item.price && item.quantity > 1 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    ₹{item.price} each
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i className="fas fa-receipt text-teal-600"></i> Order Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <div className="text-sm font-medium text-gray-500">Subtotal</div>
                                    <div className="text-gray-800">₹{order.totalAmount?.toLocaleString()}</div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="text-sm font-medium text-gray-500">Order Date</div>
                                    <div className="text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <div className="text-sm font-medium text-gray-500">Payment Status</div>
                                    <div className="text-gray-800">{order.paymentStatus || 'Pending'}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-lg font-bold text-gray-800">Total Amount</div>
                                    <div className="text-xl font-bold text-green-600">₹{order.totalAmount?.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i className="fas fa-history text-teal-600"></i> Order Timeline
                        </h2>
                        <div className="relative">
                            {/* Timeline Container */}
                            <div className="flex flex-col space-y-8">
                                {/* Order Placed */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                                            ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) 
                                                ? 'bg-linear-to-br from-emerald-400 to-emerald-600' 
                                                : 'bg-gray-400'
                                        }`}>
                                            <i className="fas fa-shopping-cart text-white text-sm"></i>
                                        </div>
                                        {/* Connector Line */}
                                        <div className="w-0.5 h-16 bg-linear-to-b from-emerald-200 to-teal-200 mt-2"></div>
                                    </div>
                                    <div className="flex-1 pb-8">
                                        <div className="bg-linear-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border-l-4 border-emerald-400">
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">Order Placed</h3>
                                            <p className="text-sm text-gray-600 mb-2">Your order has been successfully placed and confirmed</p>
                                            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                                                <i className="fas fa-clock"></i>
                                                <span>{new Date(order.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Processing */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                                            ['processing', 'shipped', 'delivered'].includes(order.status)
                                                ? 'bg-linear-to-br from-blue-400 to-blue-600'
                                                : order.status === 'pending'
                                                ? 'bg-linear-to-br from-amber-400 to-orange-500 animate-pulse'
                                                : 'bg-gray-300'
                                        }`}>
                                            <i className={`fas ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'fa-cog' : 'fa-hourglass-half'} text-white text-sm ${
                                                order.status === 'processing' ? 'animate-spin' : ''
                                            }`}></i>
                                        </div>
                                        <div className="w-0.5 h-16 bg-linear-to-b from-blue-200 to-indigo-200 mt-2"></div>
                                    </div>
                                    <div className="flex-1 pb-8">
                                        <div className={`rounded-lg p-4 border-l-4 ${
                                            ['processing', 'shipped', 'delivered'].includes(order.status)
                                                ? 'bg-linear-to-r from-blue-50 to-indigo-50 border-blue-400'
                                                : order.status === 'pending'
                                                ? 'bg-linear-to-r from-amber-50 to-orange-50 border-amber-400'
                                                : 'bg-gray-50 border-gray-300'
                                        }`}>
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">Processing Order</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {['processing', 'shipped', 'delivered'].includes(order.status)
                                                    ? 'Order is being prepared and processed'
                                                    : 'Waiting to begin processing'}
                                            </p>
                                            <div className={`flex items-center gap-2 text-xs font-semibold ${
                                                ['processing', 'shipped', 'delivered'].includes(order.status)
                                                    ? 'text-blue-600'
                                                    : order.status === 'pending'
                                                    ? 'text-amber-600'
                                                    : 'text-gray-500'
                                            }`}>
                                                <i className="fas fa-info-circle"></i>
                                                <span>
                                                    {['processing', 'shipped', 'delivered'].includes(order.status)
                                                        ? 'In progress'
                                                        : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipped */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                                            ['shipped', 'delivered'].includes(order.status)
                                                ? 'bg-linear-to-br from-purple-400 to-purple-600'
                                                : order.status === 'processing'
                                                ? 'bg-linear-to-br from-indigo-400 to-purple-500 animate-pulse'
                                                : 'bg-gray-300'
                                        }`}>
                                            <i className="fas fa-truck text-white text-sm"></i>
                                        </div>
                                        <div className="w-0.5 h-16 bg-linear-to-b from-purple-200 to-pink-200 mt-2"></div>
                                    </div>
                                    <div className="flex-1 pb-8">
                                        <div className={`rounded-lg p-4 border-l-4 ${
                                            ['shipped', 'delivered'].includes(order.status)
                                                ? 'bg-linear-to-r from-purple-50 to-pink-50 border-purple-400'
                                                : order.status === 'processing'
                                                ? 'bg-linear-to-r from-indigo-50 to-purple-50 border-indigo-400'
                                                : 'bg-gray-50 border-gray-300'
                                        }`}>
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">Shipped</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {['shipped', 'delivered'].includes(order.status)
                                                    ? 'Order has been shipped and is on the way'
                                                    : 'Waiting for shipment'}
                                            </p>
                                            <div className={`flex items-center gap-2 text-xs font-semibold ${
                                                ['shipped', 'delivered'].includes(order.status)
                                                    ? 'text-purple-600'
                                                    : order.status === 'processing'
                                                    ? 'text-indigo-600'
                                                    : 'text-gray-500'
                                            }`}>
                                                <i className="fas fa-shipping-fast"></i>
                                                <span>
                                                    {['shipped', 'delivered'].includes(order.status)
                                                        ? 'In transit'
                                                        : 'Awaiting shipment'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivered */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                                            order.status === 'delivered'
                                                ? 'bg-linear-to-br from-green-500 to-emerald-600'
                                                : order.status === 'shipped'
                                                ? 'bg-linear-to-br from-teal-400 to-green-500 animate-pulse'
                                                : 'bg-gray-300'
                                        }`}>
                                            <i className={`fas ${order.status === 'delivered' ? 'fa-check-circle' : 'fa-home'} text-white text-sm`}></i>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`rounded-lg p-4 border-l-4 ${
                                            order.status === 'delivered'
                                                ? 'bg-linear-to-r from-green-50 to-emerald-50 border-green-400'
                                                : order.status === 'shipped'
                                                ? 'bg-linear-to-r from-teal-50 to-green-50 border-teal-400'
                                                : 'bg-gray-50 border-gray-300'
                                        }`}>
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">Delivered</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {order.status === 'delivered'
                                                    ? 'Order has been successfully delivered'
                                                    : 'Pending delivery'}
                                            </p>
                                            <div className={`flex items-center gap-2 text-xs font-semibold ${
                                                order.status === 'delivered'
                                                    ? 'text-green-600'
                                                    : order.status === 'shipped'
                                                    ? 'text-teal-600'
                                                    : 'text-gray-500'
                                            }`}>
                                                <i className="fas fa-map-marker-alt"></i>
                                                <span>
                                                    {order.status === 'delivered'
                                                        ? 'Completed'
                                                        : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                        <button 
                            onClick={() => navigate(getDashboardUrl())}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                        >
                            <i className="fas fa-arrow-left"></i>
                            Back to Dashboard
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                        >
                            <i className="fas fa-print"></i>
                            Print Order
                        </button>
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button 
                                onClick={handleRefundRequest}
                                disabled={requestingRefund}
                                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {requestingRefund ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Requesting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-undo"></i>
                                        Request Refund
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;