import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import ChatModal from '../components/ChatModal';

const UserOrderDetails = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { user } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);

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

    const fetchOrderDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/user/orders/${orderId}`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log('User Order API Response:', data);
            
            if (data.success) {
                const orderData = data.data?.order || data.order || data.data;
                console.log('Processed user order data:', orderData);
                setOrder(orderData);
            } else {
                setError(data.error || 'Failed to load order details');
            }
        } catch (err) {
            console.error('Error fetching user order details:', err);
            setError('Error loading order details');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);

    const shareLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    alert(`Location shared! Lat: ${latitude}, Lng: ${longitude}`);
                },
                () => {
                    alert('Unable to retrieve your location. Please enable location services.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };

    const cancelOrder = async () => {
        if (!order) return;

        // Check if order can be cancelled
        if (order.status === 'delivered' || order.status === 'completed') {
            alert('Cannot cancel delivered or completed orders. Please contact support for returns.');
            return;
        }

        if (order.status === 'cancelled') {
            alert('This order is already cancelled.');
            return;
        }

        const confirmCancel = window.confirm(
            'Are you sure you want to cancel this order?\n\n' +
            (order.paymentMethod !== 'cod' && order.paymentStatus === 'paid' 
                ? `Amount ₹${order.totalAmount.toLocaleString()} will be refunded to your wallet.`
                : 'This action cannot be undone.')
        );

        if (!confirmCancel) return;

        try {
            const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                alert(
                    'Order cancelled successfully!' +
                    (order.paymentMethod !== 'cod' && order.paymentStatus === 'paid'
                        ? `\n\nRefund of ₹${order.totalAmount.toLocaleString()} has been credited to your wallet.`
                        : '')
                );
                // Refresh order details
                fetchOrderDetails();
            } else {
                alert(`Failed to cancel order: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Error cancelling order. Please try again or contact support.');
        }
    };

    const editOrder = async () => {
        if (!order) return;

        // Check if order can be edited
        if (order.status === 'shipped' || order.status === 'out_for_delivery' || 
            order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled') {
            alert('Cannot edit order after it has been shipped.');
            return;
        }

        // Create a form-like prompt for address fields
        const currentAddr = order.shippingAddress || {};
        const street = prompt('Street Address:', currentAddr.street || '');
        if (street === null) return; // User cancelled

        const city = prompt('City:', currentAddr.city || '');
        if (city === null) return;

        const state = prompt('State:', currentAddr.state || '');
        if (state === null) return;

        const zipCode = prompt('Zip Code:', currentAddr.zipCode || '');
        if (zipCode === null) return;

        const phoneNo = prompt('Phone Number:', currentAddr.phoneNo || '');
        if (phoneNo === null) return;

        if (!street || !city || !state || !zipCode || !phoneNo) {
            alert('All address fields are required.');
            return;
        }

        const newAddress = {
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            phoneNo: phoneNo.trim()
        };

        try {
            const response = await fetch(`/api/user/orders/${orderId}/address`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shippingAddress: newAddress })
            });

            const data = await response.json();

            if (data.success) {
                alert('Shipping address updated successfully!');
                // Refresh order details
                fetchOrderDetails();
            } else {
                alert(`Failed to update address: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating order address:', error);
            alert('Error updating address. Please try again or contact support.');
        }
    };

    const chatWithUs = () => {
        // Open chat modal
        setIsChatOpen(true);
    };

    const getStepStatus = (stepName, orderStatus) => {
        const statusFlow = {
            'pending_payment': 0,
            'confirmed': 1,
            'processing': 1,
            'shipped': 2,
            'out_for_delivery': 3,
            'delivered': 4
        };

        const stepNumbers = {
            'Payment Pending': 0,
            'Order Confirmed': 1,
            'Shipped': 2,
            'Out For Delivery': 3,
            'Delivered': 4
        };

        const currentStep = statusFlow[orderStatus] || 0;
        const thisStep = stepNumbers[stepName];

        return {
            done: currentStep > thisStep,
            active: currentStep === thisStep
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
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
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-100">
                        <div>
                            <h1 className="text-3xl font-bold text-orange-600 mb-2">Order Details</h1>
                            <div className="text-gray-500 text-sm font-medium">
                                Order #{order.orderNumber || order._id?.substring(0, 8)}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm shadow-md ${
                                order.status === 'pending_payment' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-2 border-yellow-400' :
                                order.status === 'confirmed' || order.status === 'processing' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-400' :
                                order.status === 'shipped' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-2 border-purple-400' :
                                order.status === 'out_for_delivery' ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-2 border-indigo-400' :
                                order.status === 'delivered' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-400' :
                                'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-2 border-gray-400'
                            }`}>
                                <i className={`fas ${
                                    order.status === 'pending_payment' ? 'fa-credit-card' :
                                    order.status === 'confirmed' || order.status === 'processing' ? 'fa-check-circle' :
                                    order.status === 'shipped' ? 'fa-truck' :
                                    order.status === 'out_for_delivery' ? 'fa-shipping-fast' :
                                    order.status === 'delivered' ? 'fa-check-double' :
                                    'fa-clock'
                                }`}></i>
                                <span>{order.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                        </div>
                    </div>

                    {/* Product Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i className="fas fa-box text-orange-600"></i> Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items?.map((item, index) => {
                                console.log('User Order Item Full Structure:', JSON.stringify(item, null, 2)); // Enhanced debug
                                
                                // Multiple ways to get product info
                                const product = item.product || item.productId || item;
                                const productId = product?._id || item.productId || item._id;
                                
                                // Try multiple name fields and fallbacks
                                let productName = product?.name || product?.productName || item.name || item.productName || item.title;
                                
                                // If still no name, try to construct from available data
                                if (!productName) {
                                    if (product?.breed) productName = product.breed; // For pets
                                    else if (product?.category) productName = `${product.category} Product`;
                                    else if (product?.type) productName = `${product.type}`;
                                    else if (productId) productName = `Product`;
                                    else productName = 'Unknown Product';
                                }
                                
                                console.log('Resolved product name:', productName, 'ID:', productId);
                                
                                return (
                                    <div key={index} className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-orange-200 transition-colors">
                                        <div className="w-24 h-24 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                            {productId ? (
                                                <img 
                                                    src={`/api/images/product/${productId}/0`}
                                                    alt={productName || 'Product'}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => navigate(`/buy/${productId}`)}
                                                    onError={(e) => {
                                                        console.log('Image failed to load for product:', productId);
                                                        e.target.src = '/images/default-product.jpg';
                                                    }}
                                                    onLoad={() => {
                                                        console.log('Image loaded successfully for product:', productId);
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                                    <i className="fas fa-box text-gray-500 text-xl"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-bold text-gray-900 text-xl mb-2 cursor-pointer hover:text-orange-600 transition-colors"
                                                 onClick={() => productId && navigate(`/buy/${productId}`)}>
                                                {productName}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-3">
                                                {product?.size && `Size: ${product.size}`}
                                                {product?.color && ` • Color: ${product.color}`}
                                                {order.seller && (
                                                    <div className="mt-1">
                                                        <i className="fas fa-store text-gray-400 mr-1"></i>
                                                        Seller: {order.seller.businessName || order.seller.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                                                    Qty: <span className="font-semibold">{item.quantity}</span>
                                                </div>
                                                <div className="text-2xl font-bold text-green-600">
                                                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location Sharing Card */}
                    <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <i className="fas fa-map-marker-alt text-orange-600 text-lg"></i>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-lg">Share Your Location</div>
                                    <div className="text-gray-600">Help our delivery agent reach you faster</div>
                                </div>
                            </div>
                            <button 
                                onClick={shareLocation}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-md"
                            >
                                <i className="fas fa-share-alt"></i>
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i className="fas fa-clock text-orange-600"></i> Order Timeline
                        </h2>
                        <div className="relative">
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            <div className="space-y-8">
                                {[
                                    { label: 'Payment Pending', date: order.createdAt, icon: 'fa-credit-card' },
                                    { label: 'Order Confirmed', date: order.createdAt, icon: 'fa-check-circle' },
                                    { label: 'Shipped', date: order.shippedAt, icon: 'fa-truck' },
                                    { label: 'Out For Delivery', date: order.outForDeliveryAt, icon: 'fa-shipping-fast' },
                                    { label: 'Delivered', date: order.deliveredAt, icon: 'fa-check-double' }
                                ].map((step, index) => {
                                    const stepStatus = getStepStatus(step.label, order.status);
                                    return (
                                        <div key={index} className="flex items-start space-x-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white relative z-10 ${
                                                stepStatus.done ? 'bg-gradient-to-br from-green-400 to-green-600' :
                                                stepStatus.active ? 'bg-gradient-to-br from-orange-400 to-orange-600 animate-pulse' :
                                                'bg-gray-300'
                                            }`}>
                                                <i className={`fas ${stepStatus.done ? 'fa-check' : step.icon} text-white text-sm`}></i>
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <div className={`rounded-lg p-4 border-l-4 ${
                                                    stepStatus.done ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' :
                                                    stepStatus.active ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-400' :
                                                    'bg-gray-50 border-gray-300'
                                                }`}>
                                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{step.label}</h3>
                                                    {step.date && (
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {new Date(step.date).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    )}
                                                    {step.label === 'Shipped' && stepStatus.done && (
                                                        <p className="text-xs text-gray-500">Your item has left our facility</p>
                                                    )}
                                                    {step.label === 'Delivered' && !stepStatus.done && order.estimatedDelivery && (
                                                        <p className="text-xs text-gray-500">
                                                            Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })} By 11 PM
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Order Total */}
                    <div className="mb-8 bg-gray-50 rounded-xl p-6">
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span className="text-gray-800">Total Amount</span>
                            <span className="text-green-600">₹{order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                            Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                        <button 
                            onClick={() => navigate(getDashboardUrl())}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                        >
                            <i className="fas fa-arrow-left"></i>
                            Back to Dashboard
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button 
                                onClick={cancelOrder}
                                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-full font-semibold hover:bg-red-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                            >
                                <i className="fas fa-times"></i>
                                Cancel Order
                            </button>
                        )}
                        {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') && (
                            <button 
                                onClick={editOrder}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-full font-semibold hover:bg-blue-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                            >
                                <i className="fas fa-edit"></i>
                                Edit Address
                            </button>
                        )}
                        <button 
                            onClick={chatWithUs}
                            className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-full font-semibold hover:bg-green-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                        >
                            <i className="fas fa-comments"></i>
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            <ChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                order={order}
                user={user}
            />
        </div>
    );
};

export default UserOrderDetails;