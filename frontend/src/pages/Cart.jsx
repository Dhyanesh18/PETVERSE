import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
// Removed unused imports - using direct fetch calls instead
import { FaShoppingCart, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';

const Cart = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { cart, cartCount, loading, refreshCart } = useCart();
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        // Don't call refreshCart here - CartContext already fetches on mount
    }, [isAuthenticated, navigate]);

    // Calculate summary from cart items
    const calculateSummary = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.10;
        const total = subtotal + shipping + tax;
        
        return {
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            itemCount: cartCount
        };
    };
    
    const summary = calculateSummary();

    const handleQuantityChange = async (productId, newQuantity, itemType = 'Product') => {
        if (newQuantity < 1) return;
        
        try {
            // Use the cart routes API directly since updateCartItem might not exist
            const response = await fetch('http://localhost:8080/api/cart/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ productId, quantity: newQuantity, itemType })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update cart');
            }
            
            refreshCart(); // Refresh cart after update
        } catch (err) {
            console.error('Error updating cart:', err);
            setError('Failed to update cart');
        }
    };

    const handleRemove = async (productId, itemType = 'Product') => {
        if (window.confirm('Remove this item from cart?')) {
            try {
                // Use the cart routes API directly
                const response = await fetch(`http://localhost:8080/api/cart/remove/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ itemType })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to remove item');
                }
                
                refreshCart(); // Refresh cart after removal
            } catch (err) {
                console.error('Error removing item:', err);
                setError('Failed to remove item');
            }
        }
    };

    const { subtotal = 0, shipping = 0, tax = 0, total = 0, itemCount = 0 } = summary;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading cart...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-red-600">{error}</div>
                        <button 
                            onClick={refreshCart}
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                  
                    <h1 className="text-5xl font-bold bg-linear-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-2" style={{paddingBottom:"10px"}}>Shopping Cart</h1>
                    <p className="text-xl text-gray-600">Review your items and proceed to checkout</p>
                    <div className="w-24 h-1 bg-linear-to-r from-teal-500 to-teal-600 rounded-full mx-auto mt-4"></div>
                </div>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-16 text-center max-w-lg mx-auto">
                        <div className="mb-8">
                            <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-6" />
                            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your cart is empty</h2>
                            <p className="text-gray-600">No items in your cart yet. Browse our products and add items you like.</p>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/products')}
                                className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            >
                                Browse Products
                            </button>
                            <button
                                onClick={() => navigate('/pets')}
                                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                View Pets
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
                                >
                                    <div className="flex gap-6 items-start">
                                        {/* Product Image */}
                                        <div
                                            onClick={() => navigate(`/product/${item.productId || item._id}`)}
                                            className="cursor-pointer shrink-0"
                                        >
                                            <img
                                                src={
                                                    item.images && item.images.length > 0
                                                        ? `http://localhost:8080/api/${item.itemType === 'Pet' ? 'pets' : 'products'}/${item.productId || item._id}/image/0`
                                                        : item.itemType === 'Pet'
                                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={item.name}
                                                className="w-32 h-32 object-cover rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    // Fallback to beautiful placeholder
                                                    if (item.itemType === 'Pet') {
                                                        e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/128x128/e5e7eb/6b7280?text=' + encodeURIComponent(item.name.substring(0, 10));
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between w-full mb-3">
                                                <div>
                                                    <h3
                                                        onClick={() => navigate(`/product/${item.productId || item._id}`)}
                                                        className="text-xl font-bold text-gray-800 cursor-pointer hover:text-teal-600 transition-colors line-clamp-2"
                                                    >
                                                        {item.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                                            {item.category}
                                                        </span>
                                                        {item.itemType === 'Pet' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                🐾 Pet
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.stock <= 5 && item.itemType === 'Product' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        Only {item.stock} left!
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Price */}
                                            <div className="mb-4">
                                                <div className="flex items-baseline gap-2">
                                                    {item.discount > 0 ? (
                                                        <>
                                                            <span className="text-2xl font-bold text-teal-600">
                                                                ₹{item.discountedPrice?.toFixed(2)}
                                                            </span>
                                                            <span className="text-lg text-gray-400 line-through">
                                                                ₹{item.price?.toFixed(2)}
                                                            </span>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                                                                {item.discount}% OFF
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-2xl font-bold text-teal-600">
                                                            ₹{item.price?.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {item.stock <= 5 && item.itemType === 'Product' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    Only {item.stock} left!
                                                </span>
                                            )}

                                            {/* Quantity Controls */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item.productId || item._id, item.quantity - 1, item.itemType)}
                                                        className="w-10 h-10 bg-white rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center font-bold shadow-sm border"
                                                    >
                                                        <FaMinus className="text-sm" />
                                                    </button>
                                                    <div className="px-4 py-2 bg-white rounded-lg border mx-1 min-w-[60px] text-center font-semibold">
                                                        {item.quantity}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item.productId || item._id, item.quantity + 1, item.itemType)}
                                                        disabled={item.quantity >= (item.stock || 999)}
                                                        className="w-10 h-10 bg-white rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center font-bold shadow-sm border disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <FaPlus className="text-sm" />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(item.productId || item._id, item.itemType)}
                                                    className="px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg font-semibold flex items-center gap-2 transition-all"
                                                >
                                                    <FaTrash className="text-sm" /> Remove
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 border border-gray-100">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                        <FaShoppingCart className="text-teal-600 text-sm" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Order Summary</h2>
                                </div>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                                        <span className="font-bold text-lg">₹{parseFloat(subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className={`font-bold ${parseFloat(shipping) === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                            {parseFloat(shipping) === 0 ? 'FREE' : `₹${parseFloat(shipping).toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600">Tax (10%)</span>
                                        <span className="font-bold">₹{parseFloat(tax).toFixed(2)}</span>
                                    </div>
                                    <div className="border-t-2 border-gray-100 pt-4 flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-800">Total</span>
                                        <span className="text-2xl font-bold text-teal-600">₹{parseFloat(total).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/checkout')}
                                        className="w-full bg-linear-to-r from-teal-500 to-teal-600 text-white py-4 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Proceed to Checkout
                                    </button>

                                    <button
                                        onClick={() => navigate('/products')}
                                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold border border-gray-200"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>

                                {parseFloat(subtotal) >= 500 ? (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600"></span>
                                            <span className="text-green-700 font-medium text-sm">You got free shipping!</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-600">🚚</span>
                                            <span className="text-orange-700 font-medium text-sm">
                                                Add ₹{(500 - parseFloat(subtotal)).toFixed(2)} more for free shipping
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;