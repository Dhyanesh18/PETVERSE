import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getProductById, 
    addReview, 
    getReviews, 
    getProducts,
    toggleProductWishlist,
    getWishlist,
    getUserReview,
    canUserReview
} from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Truck, XCircle, Wallet, Stethoscope, ShoppingCart, Heart, Star, MessageSquare } from 'lucide-react';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ 
        avgRating: 0, 
        totalReviews: 0, 
        distribution: {} 
    });
    const [reviewEligibility, setReviewEligibility] = useState({ 
        canReview: false, 
        reason: '', 
        orderInfo: null, 
        hasExistingReview: false 
    });
    const [userReview, setUserReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();

    // Function to load wishlist status for current product
    const loadWishlistStatus = useCallback(async () => {
        if (!isAuthenticated || !product) return;
        
        try {
            const response = await getWishlist();
            const wishlistData = response.data.data || {};
            const wishlistProductIds = (wishlistData.products || []).map(p => p._id);
            const productInWishlist = wishlistProductIds.includes(product._id);
            setIsInWishlist(productInWishlist);
            console.log('Wishlist status updated:', productInWishlist);
        } catch (error) {
            console.error('Failed to load wishlist status:', error);
        }
    }, [isAuthenticated, product]);

    const fetchProductDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [productRes, reviewsRes] = await Promise.all([
                getProductById(id),
                getReviews('Product', id)
            ]);
            console.log('Product API response:', productRes.data);
            
            const productData = productRes.data.data.product;
            setProduct(productData);
            
            const reviewsData = reviewsRes.data.data || {};
            console.log('Reviews API response data:', reviewsData);
            setReviews(reviewsData.reviews || []);
            
            const stats = reviewsData.statistics || {};
            setReviewStats({
                avgRating: stats.avgRating || 0,
                totalReviews: stats.reviewCount || 0,
                distribution: stats.ratingDistribution || {}
            });
            console.log('Review stats set:', {
                avgRating: stats.avgRating || 0,
                totalReviews: stats.reviewCount || 0,
                reviews: reviewsData.reviews?.length || 0,
                distribution: stats.ratingDistribution
            });
            
            if (isAuthenticated && productData) {
                try {
                    console.log('Checking review eligibility and wishlist status for product:', id);
                    
                    const [eligibilityRes, userReviewRes, wishlistRes] = await Promise.all([
                        canUserReview('Product', id),
                        getUserReview('Product', id),
                        getWishlist()
                    ]);
                    
                    console.log('Eligibility response:', eligibilityRes.data);
                    console.log('User review response:', userReviewRes.data);
                    console.log('Wishlist response:', wishlistRes.data);
                    
                    if (eligibilityRes.data && eligibilityRes.data.success) {
                        setReviewEligibility(eligibilityRes.data.data);
                    }
                    
                    const userReviewData = userReviewRes.data.data?.review || null;
                    
                    const wishlistData = wishlistRes.data.data || {};
                    const wishlistProductIds = (wishlistData.products || []).map(product => product._id);
                    const productInWishlist = wishlistProductIds.includes(productData._id);
                    setIsInWishlist(productInWishlist);
                    console.log('Product in wishlist:', productInWishlist);
                    setUserReview(userReviewData);
                    
                    if (userReviewData) {
                        setReviewRating(userReviewData.rating);
                        setReviewComment(userReviewData.comment);
                    }
                } catch (reviewError) {
                    console.error('Failed to check review eligibility:', reviewError);
                    console.error('Review error details:', reviewError.response?.data);
                    setReviewEligibility({
                        canReview: false,
                        reason: 'Unable to check review eligibility',
                        orderInfo: null,
                        hasExistingReview: false
                    });
                }
            } else {
                setIsInWishlist(false);
            }
            
            if (productData && productData.category) {
                console.log('Current product category:', productData.category);
                console.log('Current product ID:', productData._id);
                try {
                    const similarRes = await getProducts({ limit: 100 });
                    
                    console.log('Similar products API response:', similarRes.data);
                    
                    if (similarRes.data && similarRes.data.success && similarRes.data.data) {
                        const allProducts = Array.isArray(similarRes.data.data) 
                            ? similarRes.data.data 
                            : (similarRes.data.data.products || []);
                        
                        console.log('All products fetched:', allProducts.length);
                        
                        const categoryProducts = allProducts
                            .filter(p => {
                                const isSameCategory = p.category && p.category === productData.category;
                                const isNotCurrentProduct = p._id !== productData._id;
                                return isSameCategory && isNotCurrentProduct;
                            });
                        
                        console.log(`Found ${categoryProducts.length} similar ${productData.category} products`);
                        setSimilarProducts(categoryProducts);
                    } else {
                        console.log('No products in similar products response structure');
                        setSimilarProducts([]);
                    }
                } catch (similarError) {
                    console.error('Failed to fetch similar products:', similarError);
                    setSimilarProducts([]);
                }
            } else {
                setSimilarProducts([]);
            }
            
        } catch (error) {
            console.error('Failed to fetch product details:', error);
        } finally {
            setLoading(false);
        }
    }, [id, isAuthenticated]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        try {
            const cartItem = {
                productId: product._id,
                itemType: 'Product',
                quantity: 1
            };
            
            console.log('Adding to cart:', cartItem);
            
            await addToCart(cartItem);
            
            alert(`${product.name} has been added to your cart!`);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            const serverError = error.response?.data?.error || error.message;
            console.error('Server error message:', serverError);
            
            if (error.response?.status === 404) {
                alert('Cart service is not available. Please try again later.');
            } else if (error.response?.status === 401) {
                alert('Please login to add items to cart.');
                navigate('/login');
            } else {
                alert(`Failed to add to cart: ${serverError}`);
            }
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please login to submit a review');
            navigate('/login');
            return;
        }
        if (reviewRating === 0) {
            alert('Please select a rating');
            return;
        }
        try {
            const reviewData = {
                targetType: 'Product',
                targetId: product._id,
                rating: reviewRating,
                comment: reviewComment.trim()
            };

            await addReview(reviewData);
            alert('Review submitted successfully!');
            setReviewRating(0);
            setReviewComment('');
            setShowReviewForm(false);
            fetchProductDetails();
        } catch (error) {
            console.error('Failed to submit review:', error);
            if (error.response?.status === 403) {
                alert('You can only review products you have purchased. Please purchase this product first.');
            } else {
                alert('Failed to submit review. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
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
            <div className="min-h-screen bg-gray-50 pt-20">
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

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery */}
                        <div className="flex flex-col">
                            <div className="mb-4 rounded-lg overflow-hidden aspect-square">
                                <img
                                    src={
                                        product.imageUrls?.[selectedImage] ||
                                        `/api/products/image/${product._id}/${selectedImage}` ||
                                        `/api/products/image/${product._id}/0`
                                    }
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        if (!e.target.dataset.fallbackAttempted) {
                                            e.target.dataset.fallbackAttempted = 'true';
                                            const category = product.category?.toLowerCase() || '';
                                            const name = product.name?.toLowerCase() || '';
                                            
                                            if (category.includes('food') || name.includes('food')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                            } else if (category.includes('toy') || name.includes('toy')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                            } else if (category.includes('health') || name.includes('health')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                            } else if (category.includes('grooming') || name.includes('grooming')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                            } else {
                                                e.target.src = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                            }
                                        }
                                    }}
                                />
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            {((product.imageUrls && product.imageUrls.length > 1) || 
                              (product.images && product.images.length > 1)) && (
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: Math.max(
                                        product.imageUrls?.length || 0, 
                                        product.images?.length || 0
                                    )}).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`rounded-lg overflow-hidden border-2 aspect-square ${
                                                selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    product.imageUrls?.[index] ||
                                                    `/api/products/image/${product._id}/${index}`
                                                }
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    if (!e.target.dataset.fallbackAttempted) {
                                                        e.target.dataset.fallbackAttempted = 'true';
                                                        const category = product.category?.toLowerCase() || '';
                                                        const name = product.name?.toLowerCase() || '';
                                                        
                                                        if (category.includes('food') || name.includes('food')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                                                        } else if (category.includes('toy') || name.includes('toy')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                                                        } else if (category.includes('health') || name.includes('health')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                                                        } else if (category.includes('grooming') || name.includes('grooming')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                                                        } else {
                                                            e.target.src = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                                                        }
                                                    }
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Information */}
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
                            
                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-5 h-5 ${star <= reviewStats.avgRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-600 text-sm">
                                    {reviewStats.avgRating.toFixed(1)} ({reviewStats.totalReviews} reviews)
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
                                        <div className="text-4xl font-bold text-green-600">
                                            ₹{(product.price * (1 - product.discount / 100)).toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-4xl font-bold text-green-600">
                                        ₹{product.price.toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {product.stock > 0 ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <span className="text-2xl">✓</span>
                                        <span className="font-semibold">In Stock ({product.stock} available)</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <span className="text-2xl">✗</span>
                                        <span className="font-semibold">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Details */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Product Details</h2>
                                <div className="space-y-3">
                                    {product.brand && (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-700 mb-1">Brand:</span>
                                            <span className="text-gray-600">{product.brand}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-700 mb-1">Category:</span>
                                            <span className="text-gray-600 capitalize">{product.category}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
                                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {/* Delivery Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Free Delivery</span>
                                </div>
                                <p className="text-blue-700 text-sm ml-7">Estimated delivery: 2-4 days</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-auto">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 px-6 py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                                        product.stock === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                                    }`}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </button>
                                <button 
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            alert('Please login to add to wishlist');
                                            navigate('/login');
                                            return;
                                        }
                                        toggleProductWishlist(product._id)
                                            .then(response => {
                                                console.log('Wishlist toggle response:', response.data);
                                                if (response.data.success) {
                                                    const nowInWishlist = response.data.data?.isInWishlist || response.data.data?.wishlist;
                                                    setIsInWishlist(nowInWishlist);
                                                    alert(nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist');
                                                    
                                                    setTimeout(() => {
                                                        loadWishlistStatus();
                                                    }, 500);
                                                }
                                            })
                                            .catch(error => {
                                                console.error('Wishlist toggle failed:', error);
                                                alert('Failed to update wishlist');
                                            });
                                    }}
                                    className={`px-6 py-4 border-2 rounded-lg transition ${
                                        isInWishlist 
                                            ? 'border-red-500 bg-red-50 text-red-500' 
                                            : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                                    }`}
                                >
                                    <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <Truck className="w-10 h-10 text-teal-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Free Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Easy Returns</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <Wallet className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Secure Payment</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="flex justify-center mb-3">
                            <Stethoscope className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Quality Assured</h3>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="my-12 bg-white rounded-lg shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-8 h-8" />
                            Customer Reviews
                        </h2>
                        {isAuthenticated ? (
                            reviewEligibility && reviewEligibility.canReview ? (
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                                >
                                    {userReview ? 'Update Review' : 'Write Review'}
                                </button>
                            ) : (
                                <div className="text-sm text-gray-500 text-right">
                                    <p className="font-medium">🔒 Review Locked</p>
                                    <p className="text-xs">Purchase this product first</p>
                                </div>
                            )
                        ) : (
                            <div className="text-sm text-gray-500 text-right">
                                <p className="font-medium">Login to write a review</p>
                                <p className="text-xs">*Only available after purchase</p>
                            </div>
                        )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && isAuthenticated && reviewEligibility.canReview && (
                        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {userReview ? 'Update Your Review' : 'Write a Review'}
                            </h3>
                            <form onSubmit={handleSubmitReview} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                className="transition-colors"
                                            >
                                                <Star
                                                    className={`w-8 h-8 ${
                                                        star <= reviewRating
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="Share your thoughts about this product..."
                                        maxLength={200}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {reviewComment.length}/200 characters
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={!reviewRating || reviewComment.trim().length < 10}
                                        className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
                                    >
                                        {userReview ? 'Update Review' : 'Submit Review'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReviewForm(false);
                                            setReviewRating(userReview?.rating || 0);
                                            setReviewComment(userReview?.comment || '');
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Reviews Summary */}
                    {reviewStats && reviewStats.totalReviews > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="text-center md:text-left">
                                    <div className="text-5xl font-bold text-gray-800 mb-2">
                                        {reviewStats.avgRating.toFixed(1)}
                                    </div>
                                    <div className="flex justify-center md:justify-start mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${
                                                    star <= Math.round(reviewStats.avgRating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <div key={rating} className="flex items-center gap-3 mb-2">
                                            <span className="text-sm text-gray-600 w-12 flex items-center gap-1">
                                                {rating} <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                                            </span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-yellow-400 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${
                                                            reviewStats.totalReviews > 0 && reviewStats.distribution
                                                                ? ((reviewStats.distribution[rating] || 0) / reviewStats.totalReviews) * 100
                                                                : 0
                                                        }%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600 w-12 text-right">
                                                {reviewStats.distribution?.[rating] || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews List */}
                    {reviews && reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {review.user.fullName?.charAt(0) || review.user.username?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    {review.user.fullName || review.user.username}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${
                                                                    star <= review.rating
                                                                        ? 'text-yellow-400 fill-yellow-400'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {review.timeAgo || new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No reviews yet. Be the first to review this product!</p>
                        </div>
                    )}
                </div>

                {/* Similar Products */}
                <div className="my-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Similar Products</h2>
                    {similarProducts.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                                {similarProducts.map((similarProduct) => (
                                    <div
                                        key={similarProduct._id}
                                        className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col w-64 shrink-0"
                                        onClick={(e) => {
                                            if (!e.target.closest('.product-action')) {
                                                navigate(`/product/${similarProduct._id}`);
                                            }
                                        }}
                                    >
                                        <div className="relative w-full aspect-4/3">
                                            <img
                                                src={
                                                    similarProduct.images && similarProduct.images.length > 0
                                                        ? `http://localhost:8080/api/products/${similarProduct._id}/image/0`
                                                        : similarProduct.category?.toLowerCase().includes('food') || similarProduct.name?.toLowerCase().includes('food')
                                                        ? 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : similarProduct.category?.toLowerCase().includes('toy') || similarProduct.name?.toLowerCase().includes('toy')
                                                        ? 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                        : 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={similarProduct.name}
                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                                onError={(e) => {
                                                    const name = similarProduct.name?.toLowerCase() || '';
                                                    if (name.includes('food')) {
                                                        e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else if (name.includes('toy')) {
                                                        e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=' + encodeURIComponent(similarProduct.name || 'Product');
                                                    }
                                                }}
                                            />
                                            {similarProduct.discount && similarProduct.discount > 0 && (
                                                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                    {similarProduct.discount}% OFF
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 flex flex-col grow">
                                            <h3 className="text-base font-semibold text-gray-800 mb-1">{similarProduct.name}</h3>
                                            <p className="text-sm text-gray-500 mb-2">{similarProduct.brand}</p>
                                            
                                            {/* Rating */}
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= (similarProduct.avgRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-600">({similarProduct.reviewCount || 0})</span>
                                            </div>

                                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{similarProduct.description}</p>
                                            
                                            {/* Price */}
                                            <div className="mb-2">
                                                {similarProduct.discount && similarProduct.discount > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 line-through text-sm">₹{similarProduct.price.toFixed(2)}</span>
                                                        <span className="text-lg font-bold text-teal-600">
                                                            ₹{(similarProduct.price * (1 - similarProduct.discount / 100)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-bold text-teal-600">
                                                        ₹{similarProduct.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stock */}
                                            <div className="text-xs mb-3">
                                                {similarProduct.stock === 0 ? (
                                                    <span className="text-red-600 font-medium">Out of Stock</span>
                                                ) : similarProduct.stock <= 5 ? (
                                                    <span className="text-orange-600 font-medium">Only {similarProduct.stock} left!</span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">In Stock</span>
                                                )}
                                            </div>

                                            <div className="product-action flex gap-2 mt-auto">
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await addToCart({
                                                                productId: similarProduct._id,
                                                                itemType: 'Product',
                                                                quantity: 1
                                                            });
                                                            alert(`${similarProduct.name} added to cart!`);
                                                        } catch (error) {
                                                            console.error('Failed to add to cart:', error);
                                                            alert('Failed to add to cart');
                                                        }
                                                    }}
                                                    disabled={similarProduct.stock === 0}
                                                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                                                        similarProduct.stock === 0
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-linear-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
                                                    }`}
                                                >
                                                    Add to Cart
                                                </button>
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!isAuthenticated) {
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        try {
                                                            await toggleProductWishlist(similarProduct._id);
                                                        } catch (error) {
                                                            console.error('Failed to toggle wishlist:', error);
                                                        }
                                                    }}
                                                    className="w-10 h-10 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                                                >
                                                    <Heart className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">
                                No other {product?.category || 'similar'} products available at the moment.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;