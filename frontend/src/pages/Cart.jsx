import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const navigate = useNavigate();
    const { cart, cartCount, loading, updateCart, removeFromCart, refreshCart } = useCart();

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        await updateCart(productId, newQuantity);
    };

    const handleRemove = async (productId) => {
        if (window.confirm('Remove this item from cart?')) {
            await removeFromCart(productId);
        }
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => {
            const price = item.product?.discount > 0
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const shipping = subtotal > 0 ? 0 : 0; // Free shipping
    const total = subtotal + shipping;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Shopping Cart ({cartCount} items)</h1>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                        <p className="text-gray-600 mb-6">Add some products to get started!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.product?._id}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                                >
                                    <div className="flex gap-6">
                                        {/* Product Image */}
                                        <div
                                            onClick={() => navigate(`/buy/${item.product?._id}`)}
                                            className="cursor-pointer"
                                        >
                                            {item.product?.images && item.product.images.length > 0 ? (
                                                <img
                                                    src={`data:${item.product.images[0].contentType};base64,${item.product.images[0].data}`}
                                                    alt={item.product.name}
                                                    className="w-32 h-32 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <span className="text-gray-400">No image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1">
                                            <h3
                                                onClick={() => navigate(`/buy/${item.product?._id}`)}
                                                className="text-xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-indigo-600"
                                            >
                                                {item.product?.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">{item.product?.brand}</p>
                                            
                                            {/* Price */}
                                            <div className="mb-4">
                                                {item.product?.discount > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 line-through">
                                                            ₹{item.product.price.toFixed(2)}
                                                        </span>
                                                        <span className="text-2xl font-bold text-indigo-600">
                                                            ₹{(item.product.price * (1 - item.product.discount / 100)).toFixed(2)}
                                                        </span>
                                                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                            {item.product.discount}% OFF
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl font-bold text-indigo-600">
                                                        ₹{item.product?.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                                        className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition flex items-center justify-center font-bold"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                                        disabled={item.quantity >= (item.product?.stock || 0)}
                                                        className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition flex items-center justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleRemove(item.product._id)}
                                                    className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                                                >
                                                    🗑️ Remove
                                                </button>
                                            </div>

                                            {/* Stock Warning */}
                                            {item.product?.stock <= 5 && (
                                                <p className="text-orange-600 text-sm mt-2 font-semibold">
                                                    Only {item.product.stock} left in stock!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({cartCount} items)</span>
                                        <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Shipping</span>
                                        <span className="font-semibold text-green-600">FREE</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                                        <span>Total</span>
                                        <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition font-bold text-lg mb-4"
                                >
                                    Proceed to Checkout
                                </button>

                                <button
                                    onClick={() => navigate('/products')}
                                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                                >
                                    Continue Shopping
                                </button>

                                {/* Benefits */}
                                <div className="mt-6 pt-6 border-t space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="text-green-600">✓</span>
                                        <span>Free delivery on all orders</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="text-green-600">✓</span>
                                        <span>Secure payment</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="text-green-600">✓</span>
                                        <span>Easy returns</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;