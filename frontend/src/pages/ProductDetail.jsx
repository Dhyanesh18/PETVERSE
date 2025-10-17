import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getProductById, addReview, getReviews } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();

    const fetchProductDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [productRes, reviewsRes] = await Promise.all([
                getProductById(id),
                getReviews(id)
            ]);
            setProduct(productRes.data.product);
            setReviews(reviewsRes.data.reviews || []);
        } catch (error) {
            console.error('Failed to fetch product details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    const handleAddToCart = async () => {
        try {
            await addToCart(product._id, 1);
            alert('Added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please login to submit a review');
            navigate('/login');
            return;
        }
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        try {
            await addReview(product._id, { rating, comment });
            alert('Review submitted successfully!');
            setRating(0);
            setComment('');
            fetchProductDetails();
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Product Not Found</h1>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                        >
                            Back to Products
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery */}
                        <div>
                            <div className="mb-4 rounded-lg overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={`data:${product.images[selectedImage].contentType};base64,${product.images[selectedImage].data}`}
                                        alt={product.name}
                                        className="w-full h-96 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400">No image available</span>
                                    </div>
                                )}
                            </div>
                            
                            {product.images && product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`rounded-lg overflow-hidden border-2 ${
                                                selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={`data:${image.contentType};base64,${image.data}`}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-20 object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Information */}
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
                            
                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`text-2xl ${star <= avgRating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="text-gray-600">
                                    {avgRating.toFixed(1)} ({reviews.length} reviews)
                                </span>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                {product.discount > 0 ? (
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-gray-400 line-through text-xl">
                                                ₹{product.price.toLocaleString()}
                                            </span>
                                            <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">
                                                {product.discount}% OFF
                                            </span>
                                        </div>
                                        <div className="text-4xl font-bold text-indigo-600">
                                            ₹{(product.price * (1 - product.discount / 100)).toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-4xl font-bold text-indigo-600">
                                        ₹{product.price.toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {product.stock > 0 ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <span className="text-2xl">✓</span>
                                        <span className="font-semibold">In Stock</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <span className="text-2xl">✗</span>
                                        <span className="font-semibold">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Delivery Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">🚚</span>
                                    <span className="font-semibold text-blue-900">Free Delivery</span>
                                </div>
                                <p className="text-blue-700 text-sm">Estimated delivery: 2-4 days</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 px-6 py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                                        product.stock === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                                >
                                    <span>🛒</span>
                                    Add to Cart
                                </button>
                                <button className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                    <span className="text-2xl">❤️</span>
                                </button>
                            </div>

                            {/* Product Details */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Product Details</h2>
                                <div className="space-y-2">
                                    {product.brand && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Brand:</span>
                                            <span className="text-gray-600">{product.brand}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Category:</span>
                                            <span className="text-gray-600">{product.category}</span>
                                        </div>
                                    )}
                                    {product.description && (
                                        <div className="mt-4">
                                            <span className="font-semibold text-gray-700">Description:</span>
                                            <p className="text-gray-600 mt-2">{product.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Reviews</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Submit Review */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Rate this Product</h3>
                            <form onSubmit={handleSubmitReview}>
                                <div className="mb-4">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="text-4xl transition"
                                            >
                                                <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>
                                                    ★
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows="4"
                                    placeholder="Write your feedback..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                                >
                                    Submit Review
                                </button>
                            </form>
                        </div>

                        {/* Reviews List */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Customer Reviews</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {reviews.length > 0 ? (
                                    reviews.map((review, index) => (
                                        <div key={index} className="border-b border-gray-200 pb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-gray-800">
                                                    {review.user?.username || review.user?.firstName || 'Anonymous'}
                                                </span>
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span
                                                            key={star}
                                                            className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600">{review.comment}</p>
                                            {review.date && (
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {new Date(review.date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;