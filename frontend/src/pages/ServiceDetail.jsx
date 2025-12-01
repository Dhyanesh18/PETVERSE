import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    getServiceById, 
    getReviews, 
    addReview, 
    deleteReview 
} from '../services/api';
import BookingModal from '../components/BookingModal';
import { 
    FaStar, 
    FaMapMarkerAlt, 
    FaPhone, 
    FaEnvelope, 
    FaCalendarAlt, 
    FaClock,
    FaPaw,
    FaUser,
    FaEdit,
    FaTrash,
    FaTimes
} from 'react-icons/fa';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });

    const [reviewsPage, setReviewsPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(true);

    useEffect(() => {
        fetchServiceDetails();
        fetchReviews();
    }, [id]);

    const fetchServiceDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching service details for ID:', id);
            const response = await getServiceById(id);
            console.log('Service details response:', response.data);
            
            const serviceData = response.data.data?.service || response.data.service || response.data;
            console.log('Parsed service data:', serviceData);
            
            if (!serviceData || !serviceData._id) {
                throw new Error('Invalid service data received');
            }
            
            setService(serviceData);
        } catch (error) {
            console.error('Error fetching service:', error);
            console.error('Error response:', error.response);
            setError(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load service details');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (page = 1) => {
        try {
            const response = await getReviews('ServiceProvider', id);
            const reviewsData = response.data.data?.reviews || response.data.reviews || [];
            
            if (page === 1) {
                setReviews(reviewsData);
            } else {
                setReviews(prev => [...prev, ...reviewsData]);
            }
            
            setHasMoreReviews(reviewsData.length === 5);
            setReviewsPage(page);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const handleBookNow = () => {
        if (!user) {
            alert('Please login to book services');
            navigate('/login');
            return;
        }
        setShowBookingModal(true);
    };

    const handleAddReview = () => {
        if (!user) {
            alert('Please login to add a review');
            navigate('/login');
            return;
        }
        setShowReviewModal(true);
        setEditingReview(null);
        setReviewForm({ rating: 5, comment: '' });
    };

    const handleEditReview = (review) => {
        setShowReviewModal(true);
        setEditingReview(review);
        setReviewForm({
            rating: review.rating,
            comment: review.comment
        });
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            await addReview({
                targetId: id,
                targetType: 'ServiceProvider',
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });
            
            setShowReviewModal(false);
            setReviewForm({ rating: 5, comment: '' });
            setEditingReview(null);
            fetchReviews(1);
            fetchServiceDetails(); // Refresh to update rating
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(error.response?.data?.message || 'Failed to submit review');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        
        try {
            await deleteReview(reviewId);
            fetchReviews(1);
            fetchServiceDetails();
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
        }
    };

    const renderStars = (rating, interactive = false, onChange = null) => {
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className={`${
                    index < rating 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                } ${interactive ? 'cursor-pointer hover:text-yellow-300 text-2xl' : ''}`}
                onClick={() => interactive && onChange && onChange(index + 1)}
            />
        ));
    };

    const getServiceImage = (serviceType) => {
        const imageMap = {
            'veterinarian': '/images/services/service1.jpg',
            'groomer': '/images/services/service7.jpg',
            'pet sitter': '/images/services/service11.jpg',
            'trainer': '/images/services/service6.jpg',
            'breeder': '/images/services/service12.jpg',
            'walking': '/images/services/service2.jpg',
            'sitting': '/images/services/service11.jpg'
        };
        return imageMap[serviceType?.toLowerCase()] || '/images/services/service2.jpg';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center">
                    <FaPaw className="text-6xl text-indigo-500 animate-bounce mx-auto mb-4" />
                    <p className="text-xl text-gray-700 font-semibold">Loading Service Details...</p>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Service Not Found</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/services')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                    >
                        Back to Services
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/services')}
                    className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center gap-2 font-medium"
                >
                    ← Back to Services
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Service Header */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="h-64 overflow-hidden bg-gray-200">
                                <img
                                    src={getServiceImage(service.serviceType)}
                                    alt={service.name || service.fullName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/images/services/service2.jpg';
                                    }}
                                />
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                            {service.name || service.fullName}
                                        </h1>
                                        <p className="text-lg text-indigo-600 font-medium">
                                            {service.category || service.serviceType}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-green-600">₹{service.price}</div>
                                        <p className="text-sm text-gray-500">per visit</p>
                                    </div>
                                </div>

                                {/* Rating */}
                                {service.rating > 0 && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1">
                                            {renderStars(service.rating)}
                                        </div>
                                        <span className="text-lg font-semibold text-gray-700">
                                            {service.rating.toFixed(1)}
                                        </span>
                                        <span className="text-gray-600">
                                            ({service.reviewCount || reviews.length} reviews)
                                        </span>
                                    </div>
                                )}

                                {/* Description */}
                                {service.description && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                                        <p className="text-gray-600">{service.description}</p>
                                    </div>
                                )}

                                {/* Experience & Specialization */}
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    {service.experience && (
                                        <div>
                                            <span className="text-sm text-gray-500">Experience</span>
                                            <p className="font-semibold text-gray-800">{service.experience}</p>
                                        </div>
                                    )}
                                    {service.specialization && (
                                        <div>
                                            <span className="text-sm text-gray-500">Specialization</span>
                                            <p className="font-semibold text-gray-800">{service.specialization}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="border-t pt-4 space-y-2">
                                    <h3 className="font-semibold text-gray-800 mb-3">Contact Information</h3>
                                    
                                    {service.serviceAddress && (
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-indigo-600" />
                                            {service.serviceAddress}
                                        </p>
                                    )}
                                    
                                    {service.phone && (
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <FaPhone className="text-indigo-600" />
                                            {service.phone}
                                        </p>
                                    )}
                                    
                                    {service.email && (
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <FaEnvelope className="text-indigo-600" />
                                            {service.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
                                <button
                                    onClick={handleAddReview}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    Write a Review
                                </button>
                            </div>

                            {reviews.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map(review => (
                                        <div key={review._id} className="border-b pb-4 last:border-b-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <FaUser className="text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {review.userName || review.user?.fullName || 'Anonymous'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {user && review.user?._id === user._id && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditReview(review)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReview(review._id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-1 mb-2">
                                                {renderStars(review.rating)}
                                            </div>
                                            
                                            <p className="text-gray-700">{review.comment}</p>
                                        </div>
                                    ))}
                                    
                                    {hasMoreReviews && (
                                        <button
                                            onClick={() => fetchReviews(reviewsPage + 1)}
                                            className="w-full text-indigo-600 hover:text-indigo-800 font-medium py-2"
                                        >
                                            Load More Reviews
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Book This Service</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaCalendarAlt className="text-indigo-600" />
                                    <span>Flexible scheduling</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaClock className="text-indigo-600" />
                                    <span>Available time slots</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBookNow}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-lg shadow-md hover:shadow-lg"
                            >
                                Book Now
                            </button>

                            {service.availableSlots && service.availableSlots.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="font-semibold text-gray-800 mb-3">Available Time Slots</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {service.availableSlots.slice(0, 6).map((slot, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                            >
                                                {slot}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <BookingModal
                    service={service}
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={() => {
                        setShowBookingModal(false);
                        alert('Booking successful!');
                    }}
                />
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingReview ? 'Edit Review' : 'Write a Review'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setEditingReview(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {renderStars(reviewForm.rating, true, (rating) => 
                                        setReviewForm(prev => ({ ...prev, rating }))
                                    )}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Your Review</label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows="4"
                                    required
                                    placeholder="Share your experience..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setEditingReview(null);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    {editingReview ? 'Update' : 'Submit'} Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceDetail;
