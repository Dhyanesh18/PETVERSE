import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById, togglePetWishlist, getWishlist, getPets, getReviews, getUserReview, addReview, deleteReview, canUserReview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const PetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [similarPets, setSimilarPets] = useState([]);
    const [isWishlisted, setIsWishlisted] = useState(false);
    
    // Review-related state
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [userReview, setUserReview] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewEligibility, setReviewEligibility] = useState({
        canReview: false,
        reason: '',
        orderInfo: null,
        hasExistingReview: false
    });

    const fetchPetDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [petResponse, wishlistResponse] = await Promise.all([
                getPetById(id),
                isAuthenticated ? getWishlist().catch(() => ({ data: { data: { pets: [] } } })) : Promise.resolve({ data: { data: { pets: [] } } })
            ]);
            
            console.log('Full pet API response:', petResponse.data);
            console.log('Pet response keys:', Object.keys(petResponse.data));
            console.log('Pet data keys:', petResponse.data.data ? Object.keys(petResponse.data.data) : 'no data.data');
            
            let petData, similarPetsData;
            
            // Check if the response structure matches backend expectation
            if (petResponse.data.data && petResponse.data.data.pet) {
                // Backend returns { success: true, data: { pet: ..., similarPets: ... } }
                petData = petResponse.data.data.pet;
                similarPetsData = petResponse.data.data.similarPets || [];
                
                console.log('Using nested structure - Pet:', petData);
                console.log('Using nested structure - Similar pets:', similarPetsData);
            } else {
                // Current structure where pet data is directly in data
                petData = petResponse.data.data;
                similarPetsData = petResponse.data.data?.similarPets || petResponse.data.similarPets || [];
                
                console.log('Using direct structure - Pet:', petData);
                console.log('Using direct structure - Similar pets:', similarPetsData);
            }
            
            setPet(petData);
            setSimilarPets(similarPetsData);
            
            // Check wishlist status from user's wishlist data
            if (isAuthenticated && wishlistResponse.data.data) {
                const wishlistPetIds = (wishlistResponse.data.data.pets || []).map(pet => pet._id);
                setIsWishlisted(wishlistPetIds.includes(id));
            } else {
                setIsWishlisted(false);
            }
            
            // Always fetch similar pets from the same category (dogs with dogs, cats with cats)
            if (petData && petData.category) {
                console.log('Current pet category:', petData.category);
                console.log('Current pet breed:', petData.breed);
                try {
                    // Fetch all pets and filter by category on frontend to ensure accuracy
                    const similarResponse = await getPets({ 
                        limit: 20 // Get more pets to filter from
                    });
                    
                    const allPets = similarResponse.data.data || similarResponse.data || [];
                    console.log('All pets fetched:', allPets.length);
                    console.log('Sample pet categories:', allPets.slice(0, 3).map(p => ({ name: p.name, category: p.category, breed: p.breed })));
                    
                    // Filter pets by exact category match and exclude current pet
                    const categoryPets = allPets
                        .filter(p => {
                            const isSameCategory = p.category && p.category.toLowerCase() === petData.category.toLowerCase();
                            const isNotCurrentPet = p._id !== id;
                            console.log(`Pet ${p.name}: category="${p.category}", matches="${isSameCategory}", notCurrent="${isNotCurrentPet}"`);
                            return isSameCategory && isNotCurrentPet;
                        })
                        .slice(0, 4); // Show 4 similar pets
                    
                    console.log(`Found ${categoryPets.length} similar ${petData.category} pets:`, categoryPets.map(p => ({ name: p.name, category: p.category })));
                    setSimilarPets(categoryPets);
                } catch (similarError) {
                    console.error('Failed to fetch similar pets:', similarError);
                    setSimilarPets([]);
                }
            } else {
                // If no category, set empty array
                setSimilarPets([]);
            }
        } catch (error) {
            console.error('Failed to fetch pet details:', error);
        } finally {
            setLoading(false);
        }
    }, [id, isAuthenticated]);

    useEffect(() => {
        fetchPetDetails();
    }, [id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleWishlistToggle = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        try {
            await togglePetWishlist(id);
            setIsWishlisted(!isWishlisted);
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        try {
            // Add pet to cart with proper data structure
            const cartItem = {
                productId: pet._id,
                itemType: 'Pet',
                quantity: 1
            };
            
            console.log('Adding to cart:', cartItem);
            console.log('Pet object:', pet);
            console.log('Auth status:', isAuthenticated);
            console.log('Pet ID:', pet._id);
            
            // Use the CartContext addToCart function which handles API call and updates count
            await addToCart(cartItem);
            
            alert(`${pet.name} has been added to your cart!`);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            // Show the specific error message from server
            const serverError = error.response?.data?.error || error.message;
            console.error('Server error message:', serverError);
            
            if (error.response?.status === 404) {
                alert('Cart service is not available. Please try again later.');
            } else if (error.response?.status === 401) {
                alert('Please log in again to add items to cart.');
                navigate('/login');
            } else if (error.response?.status === 400) {
                alert(`Validation error: ${serverError}`);
            } else {
                alert(`Failed to add to cart: ${serverError}`);
            }
        }
    };

    // Fetch reviews for the pet
    const fetchReviews = useCallback(async () => {
        if (!pet?._id) return;
        
        try {
            const response = await getReviews('Pet', pet._id);
            if (response.data && response.data.success) {
                setReviews(response.data.data?.reviews || []);
                setReviewStats(response.data.data?.statistics || null);
            } else {
                // No reviews or API not ready yet, set empty state
                setReviews([]);
                setReviewStats(null);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            // Set empty state on error to prevent crashes
            setReviews([]);
            setReviewStats(null);
        }
    }, [pet?._id]);

    // Fetch user's existing review
    const fetchUserReview = useCallback(async () => {
        if (!pet?._id || !isAuthenticated) return;
        
        try {
            const response = await getUserReview('Pet', pet._id);
            if (response.data && response.data.success && response.data.hasReview) {
                const userReviewData = response.data.data?.review;
                if (userReviewData) {
                    setUserReview(userReviewData);
                    setReviewRating(userReviewData.rating || 0);
                    setReviewComment(userReviewData.comment || '');
                }
            } else {
                // No user review exists, reset form
                setUserReview(null);
                setReviewRating(0);
                setReviewComment('');
            }
        } catch (error) {
            console.error('Failed to fetch user review:', error);
            // Reset form on error
            setUserReview(null);
            setReviewRating(0);
            setReviewComment('');
        }
    }, [pet?._id, isAuthenticated]);

    // Check if user can review this pet
    const checkReviewEligibility = useCallback(async () => {
        if (!pet?._id || !isAuthenticated) {
            setReviewEligibility({
                canReview: false,
                reason: 'Please login to review',
                orderInfo: null,
                hasExistingReview: false
            });
            return;
        }
        
        try {
            const response = await canUserReview('Pet', pet._id);
            if (response.data && response.data.success) {
                setReviewEligibility(response.data.data);
            }
        } catch (error) {
            console.error('Failed to check review eligibility:', error);
            setReviewEligibility({
                canReview: false,
                reason: 'Unable to check review eligibility',
                orderInfo: null,
                hasExistingReview: false
            });
        }
    }, [pet?._id, isAuthenticated]);

    // Handle review submission
    const handleSubmitReview = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!reviewRating || reviewComment.trim().length < 10) {
            alert('Please provide a rating and a comment with at least 10 characters.');
            return;
        }

        try {
            const reviewData = {
                targetType: 'Pet',
                targetId: pet._id,
                rating: reviewRating,
                comment: reviewComment.trim()
            };

            await addReview(reviewData);
            
            // Refresh reviews and reset form
            await fetchReviews();
            await fetchUserReview();
            await checkReviewEligibility();
            setShowReviewForm(false);
            
            alert(userReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        } catch (error) {
            console.error('Failed to submit review:', error);
            if (error.response?.status === 403) {
                alert('You can only review pets you have purchased. Please purchase this pet first.');
            } else {
                alert('Failed to submit review. Please try again.');
            }
        }
    };

    // Handle review deletion
    const handleDeleteReview = async () => {
        if (!userReview) return;

        if (!window.confirm('Are you sure you want to delete your review?')) {
            return;
        }

        try {
            await deleteReview(userReview._id);
            
            // Refresh reviews and reset form
            await fetchReviews();
            await fetchUserReview();
            await checkReviewEligibility();
            setShowReviewForm(false);
            
            alert('Review deleted successfully!');
        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('Failed to delete review. Please try again.');
        }
    };

    // Fetch reviews when pet data is available
    useEffect(() => {
        if (pet?._id) {
            fetchReviews();
            fetchUserReview();
            checkReviewEligibility();
        }
    }, [pet?._id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (!pet && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pet Not Found</h1>
                        <button
                            onClick={() => navigate('/pets')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                        >
                            Back to Pets
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery */}
                        <div>
                            <div className="mb-4 rounded-lg overflow-hidden">
                                {(pet.imageUrls && pet.imageUrls.length > 0) || (pet.images && pet.images.length > 0) ? (
                                    <img
                                        src={
                                            pet.imageUrls && pet.imageUrls.length > 0 
                                                ? `http://localhost:8080${pet.imageUrls[selectedImage]}`
                                                : `http://localhost:8080/api/pets/image/${pet._id}/${selectedImage}`
                                        }
                                        alt={pet.name}
                                        className="w-full h-96 object-cover"
                                        onError={(e) => {
                                            // Try alternative image source
                                            if (pet.imageUrls && pet.imageUrls[selectedImage] && !e.target.src.includes('/images/pet/')) {
                                                e.target.src = `http://localhost:8080${pet.imageUrls[selectedImage]}`;
                                            } else if (pet.images && pet.images.length > selectedImage && !e.target.src.includes('/api/pets/image/')) {
                                                e.target.src = `http://localhost:8080/api/pets/image/${pet._id}/${selectedImage}`;
                                            } else {
                                                // Final fallback to breed-specific placeholder
                                                const breed = pet.breed?.toLowerCase() || '';
                                                if (breed.includes('dog') || breed.includes('german') || breed.includes('shepherd')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                                } else if (breed.includes('cat')) {
                                                    e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                                } else {
                                                    e.target.src = 'https://via.placeholder.com/500x384/e5e7eb/6b7280?text=' + encodeURIComponent(pet.name || 'Pet');
                                                }
                                            }
                                        }}
                                    />
                                ) : pet.thumbnail ? (
                                    <img
                                        src={`http://localhost:8080${pet.thumbnail}`}
                                        alt={pet.name}
                                        className="w-full h-96 object-cover"
                                        onError={(e) => {
                                            // Fallback to breed-specific placeholder
                                            const breed = pet.breed?.toLowerCase() || '';
                                            if (breed.includes('dog') || breed.includes('german') || breed.includes('shepherd')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                            } else if (breed.includes('cat')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                                            } else {
                                                e.target.src = 'https://via.placeholder.com/500x384/e5e7eb/6b7280?text=' + encodeURIComponent(pet.name || 'Pet');
                                            }
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={pet.breed?.toLowerCase().includes('dog') || pet.breed?.toLowerCase().includes('german') || pet.breed?.toLowerCase().includes('shepherd') 
                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
                                            : pet.category === 'cats' || pet.breed?.toLowerCase().includes('cat')
                                            ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
                                            : 'https://via.placeholder.com/500x384/e5e7eb/6b7280?text=' + encodeURIComponent(pet.name || 'Pet')
                                        }
                                        alt={pet.name}
                                        className="w-full h-96 object-cover"
                                    />
                                )}
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            {((pet.imageUrls && pet.imageUrls.length > 1) || (pet.images && pet.images.length > 1)) && (
                                <div className="grid grid-cols-4 gap-2">
                                    {(pet.imageUrls || pet.images || []).map((imageUrl, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`rounded-lg overflow-hidden border-2 ${
                                                selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    pet.imageUrls && pet.imageUrls.length > 0 
                                                        ? `http://localhost:8080${pet.imageUrls[index]}`
                                                        : `http://localhost:8080/api/pets/image/${pet._id}/${index}`
                                                }
                                                alt={`${pet.name} ${index + 1}`}
                                                className="w-full h-20 object-cover"
                                                onError={(e) => {
                                                    // Try alternative source
                                                    if (pet.imageUrls && pet.imageUrls[index] && !e.target.src.includes('/images/pet/')) {
                                                        e.target.src = `http://localhost:8080${pet.imageUrls[index]}`;
                                                    } else if (pet.images && pet.images[index] && !e.target.src.includes('/api/pets/image/')) {
                                                        e.target.src = `http://localhost:8080/api/pets/image/${pet._id}/${index}`;
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=' + (index + 1);
                                                    }
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pet Information */}
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">{pet.name}</h1>
                            
                            <div className="text-4xl font-bold text-indigo-600 mb-6">
                                ₹{pet.price.toLocaleString()}
                            </div>

                            {/* Pet Details Grid */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Pet Details</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="font-semibold text-gray-700">Category:</span>
                                        <p className="text-gray-600 capitalize">{pet.category}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Breed:</span>
                                        <p className="text-gray-600">{pet.breed}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Age:</span>
                                        <p className="text-gray-600">{pet.age}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Gender:</span>
                                        <p className="text-gray-600 capitalize flex items-center gap-1">
                                            {pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                                        </p>
                                    </div>
                                    {pet.color && (
                                        <div>
                                            <span className="font-semibold text-gray-700">Color:</span>
                                            <p className="text-gray-600">{pet.color}</p>
                                        </div>
                                    )}
                                    {pet.weight && (
                                        <div>
                                            <span className="font-semibold text-gray-700">Weight:</span>
                                            <p className="text-gray-600">{pet.weight}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
                                <p className="text-gray-600 leading-relaxed">{pet.description}</p>
                            </div>

                            {/* Delivery Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">🚚</span>
                                    <span className="font-semibold text-blue-900">Free Delivery</span>
                                </div>
                                <p className="text-blue-700 text-sm">
                                    Estimated delivery: 2-4 days
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                                >
                                    <span>🛒</span>
                                    Add to Cart
                                </button>
                                <button 
                                    onClick={handleWishlistToggle}
                                    className={`px-6 py-4 border-2 rounded-lg transition ${
                                        isWishlisted 
                                            ? 'border-red-500 bg-red-50 text-red-500' 
                                            : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                                    }`}
                                >
                                    <span className="text-2xl">{isWishlisted ? '❤️' : '🤍'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">🚚</div>
                        <h3 className="font-semibold text-gray-800">Free Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">🚫</div>
                        <h3 className="font-semibold text-gray-800">No Returns</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">💰</div>
                        <h3 className="font-semibold text-gray-800">Pay On Delivery</h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="text-4xl mb-2">🩺</div>
                        <h3 className="font-semibold text-gray-800">Free Check Up</h3>
                    </div>
                </div>



                {/* Reviews Section */}
                <div className="my-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-800">Reviews</h2>
                        {isAuthenticated ? (
                            reviewEligibility.canReview ? (
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    {userReview ? 'Update Review' : 'Write Review'}
                                </button>
                            ) : (
                                <div className="text-sm text-gray-500 text-right">
                                    <p>🔒 Review Locked</p>
                                    <p className="text-xs">Purchase this pet first</p>
                                </div>
                            )
                        ) : (
                            <div className="text-sm text-gray-500 text-right">
                                <p>Login to write a review</p>
                                <p className="text-xs">*Only available after purchase</p>
                            </div>
                        )}
                    </div>

                    {/* Review Eligibility Notice */}
                    {isAuthenticated && (
                        <div className={`border rounded-lg p-4 mb-6 ${
                            reviewEligibility.canReview 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-amber-50 border-amber-200'
                        }`}>
                            <div className="flex items-start space-x-3">
                                <div className={reviewEligibility.canReview ? 'text-green-500' : 'text-amber-500'}>
                                    <i className={`fas ${reviewEligibility.canReview ? 'fa-check-circle' : 'fa-shopping-cart'}`}></i>
                                </div>
                                <div>
                                    <h4 className={`font-semibold ${
                                        reviewEligibility.canReview ? 'text-green-800' : 'text-amber-800'
                                    }`}>
                                        {reviewEligibility.canReview ? 'Review Unlocked!' : 'Purchase Required'}
                                    </h4>
                                    <p className={`text-sm mt-1 ${
                                        reviewEligibility.canReview ? 'text-green-700' : 'text-amber-700'
                                    }`}>
                                        {reviewEligibility.reason}
                                    </p>
                                    {reviewEligibility.orderInfo && (
                                        <div className="mt-2 text-xs text-green-600">
                                            <p>📦 Order #{reviewEligibility.orderInfo.orderNumber}</p>
                                            <p>Status: {reviewEligibility.orderInfo.status.toUpperCase()}</p>
                                            <p>Ordered: {new Date(reviewEligibility.orderInfo.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Review Form */}
                    {showReviewForm && isAuthenticated && reviewEligibility.canReview && (
                        <div className="bg-gray-50 p-6 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {userReview ? 'Update Your Review' : 'Write a Review'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                className={`text-2xl ${
                                                    star <= reviewRating
                                                        ? 'text-yellow-400 hover:text-yellow-500'
                                                        : 'text-gray-300 hover:text-yellow-300'
                                                } transition-colors`}
                                            >
                                                ★
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Share your thoughts about this pet..."
                                        maxLength={200}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {reviewComment.length}/200 characters
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={!reviewRating || reviewComment.trim().length < 10}
                                        className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        {userReview ? 'Update Review' : 'Submit Review'}
                                    </button>
                                    {userReview && (
                                        <button
                                            onClick={handleDeleteReview}
                                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            Delete Review
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowReviewForm(false);
                                            setReviewRating(userReview?.rating || 0);
                                            setReviewComment(userReview?.comment || '');
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Summary */}
                    {reviewStats && (
                        <div className="bg-white border rounded-lg p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-800">
                                            {reviewStats.avgRating.toFixed(1)}
                                        </div>
                                        <div className="flex justify-center mb-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`text-lg ${
                                                        star <= Math.round(reviewStats.avgRating)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {reviewStats.reviewCount} review{reviewStats.reviewCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 ml-8">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <div key={rating} className="flex items-center mb-1">
                                            <span className="text-sm text-gray-600 w-8">{rating}★</span>
                                            <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-yellow-400 h-2 rounded-full"
                                                    style={{
                                                        width: `${
                                                            reviewStats.reviewCount > 0 && reviewStats.ratingDistribution
                                                                ? ((reviewStats.ratingDistribution[rating] || 0) / reviewStats.reviewCount) * 100
                                                                : 0
                                                        }%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600 w-8 text-right">
                                                {reviewStats.ratingDistribution?.[rating] || 0}
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
                                <div key={review._id} className="bg-white border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold">
                                                    {review.user.fullName?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    {review.user.fullName || review.user.username}
                                                </h4>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <span
                                                                key={star}
                                                                className={`text-sm ${
                                                                    star <= review.rating
                                                                        ? 'text-yellow-400'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            >
                                                                ★
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {review.timeAgo}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-700">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-comment-alt text-4xl mb-4"></i>
                            <p>No reviews yet. Be the first to review this pet!</p>
                        </div>
                    )}
                </div>

                {/* Similar Pets */}
                <div className="my-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Similar Pets</h2>
                    {similarPets.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                                {similarPets.map((similarPet) => (
                                    <div
                                        key={similarPet._id}
                                        className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col w-64 flex-shrink-0"
                                        onClick={(e) => {
                                            if (!e.target.closest('.product-action')) {
                                                navigate(`/seller/detail/${similarPet._id}`);
                                            }
                                        }}
                                    >
                                        <div className="relative w-full pt-[75%]">
                                            <img
                                                src={
                                                    similarPet.images && similarPet.images.length > 0
                                                        ? `http://localhost:8080/api/pets/${similarPet._id}/image/0`
                                                        : similarPet.thumbnail 
                                                        ? `http://localhost:8080${similarPet.thumbnail}`
                                                        : similarPet.category === 'dogs' || similarPet.breed?.toLowerCase().includes('dog') || similarPet.breed?.toLowerCase().includes('shepherd') || similarPet.breed?.toLowerCase().includes('rottweiler')
                                                            ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : similarPet.category === 'cats' || similarPet.breed?.toLowerCase().includes('cat') || similarPet.breed?.toLowerCase().includes('persian') || similarPet.breed?.toLowerCase().includes('siamese')
                                                            ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : similarPet.category === 'birds' || similarPet.breed?.toLowerCase().includes('bird')
                                                            ? 'https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : similarPet.category === 'fish' || similarPet.breed?.toLowerCase().includes('fish')
                                                            ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                            : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={similarPet.name}
                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to breed-specific placeholder
                                                    const breed = similarPet.breed?.toLowerCase() || '';
                                                    if (breed.includes('dog') || breed.includes('shepherd') || breed.includes('rottweiler')) {
                                                        e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else if (breed.includes('cat') || breed.includes('persian') || breed.includes('siamese')) {
                                                        e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                    } else {
                                                        e.target.src = 'https://via.placeholder.com/250x190/e5e7eb/6b7280?text=' + encodeURIComponent(similarPet.name || 'Pet');
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="p-3 flex flex-col grow">
                                            <h3 className="text-base font-semibold text-gray-800 mb-1">{similarPet.name}</h3>
                                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{similarPet.description}</p>
                                            <div className="text-base font-medium text-green-600 mb-2">
                                                ₹{similarPet.price?.toFixed(2)}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <i className="fas fa-birthday-cake"></i> {similarPet.age}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {similarPet.gender === 'male' ? (
                                                        <><i className="fas fa-mars"></i> Male</>
                                                    ) : (
                                                        <><i className="fas fa-venus"></i> Female</>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="product-action flex justify-between items-center mt-auto">
                                                <button 
                                                    onClick={() => navigate(`/seller/detail/${similarPet._id}`)}
                                                    className="flex-1 bg-linear-to-r from-teal-500 to-teal-600 text-white py-1.5 px-2 rounded text-xs hover:from-teal-600 hover:to-teal-700 transition mr-2"
                                                >
                                                    View Details
                                                </button>
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!isAuthenticated) {
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        try {
                                                            await togglePetWishlist(similarPet._id);
                                                            // You can add state update here if needed
                                                        } catch (error) {
                                                            console.error('Failed to toggle wishlist:', error);
                                                        }
                                                    }}
                                                    className="w-8 h-8 border border-gray-300 rounded-full hover:border-red-500 hover:text-red-500 transition flex items-center justify-center"
                                                >
                                                    <i className="far fa-heart text-gray-600 text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">No similar pets available at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PetDetail;