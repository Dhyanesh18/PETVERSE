import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLostPetById, addComment, updateStatus } from '../redux/slices/lostPetSlice';
import { useAuth } from '../hooks/useAuth';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, FaArrowLeft, FaPaw, FaComment } from 'react-icons/fa';

const LostPetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useAuth();
    
    // Get state from Redux
    const { currentLostPet, loading, error } = useSelector(state => state.lostPet);

    const [selectedImage, setSelectedImage] = useState(0);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        dispatch(fetchLostPetById(id));
    }, [dispatch, id]);

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Mark this pet as ${newStatus}?`)) return;
        try {
            await dispatch(updateStatus({ id, status: newStatus })).unwrap();
            alert(`Status updated to ${newStatus}`);
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setSubmittingComment(true);
        try {
            await dispatch(addComment({ id, message: comment })).unwrap();
            setComment('');
            setShowCommentForm(false);
            alert('Comment added successfully');
        } catch (error) {
            alert('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getImageUrl = (index = 0) => {
        if (!pet.images || pet.images.length === 0) {
            return '/images/default-pet.jpg';
        }
        
        const image = pet.images[index];
        
        // Handle string URLs (external URLs or stored paths)
        if (typeof image === 'string') {
            return image.startsWith('http') ? image : `http://localhost:8080/api/lost-pets/image/${id}/${index}`;
        }
        
        // Handle object with url property
        if (typeof image === 'object' && image?.url) {
            return image.url.startsWith('http') ? image.url : `http://localhost:8080/api/lost-pets/image/${id}/${index}`;
        }
        
        // Fallback: try to load from API endpoint (for MongoDB binary data)
        return `http://localhost:8080/api/lost-pets/image/${id}/${index}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center">
                    <FaPaw className="text-6xl text-teal-500 animate-bounce mx-auto mb-4" />
                    <p className="text-xl text-gray-700 font-semibold">Loading pet details...</p>
                </div>
            </div>
        );
    }

    if (error || !currentLostPet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Pet Not Found</h2>
                    <p className="text-gray-600 mb-4">{error || 'This pet listing does not exist'}</p>
                    <button
                        onClick={() => navigate('/lost-found')}
                        className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors font-semibold"
                    >
                        Back to Lost & Found
                    </button>
                </div>
            </div>
        );
    }

    const pet = currentLostPet;
    const isOwner = user && user._id === pet.postedBy._id;

    return (
        <div className="bg-gray-50 min-h-screen" style={{ paddingTop: '95px' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/lost-found')}
                    className="mb-6 text-teal-600 hover:text-teal-800 flex items-center gap-2 font-semibold transition-colors"
                >
                    <FaArrowLeft /> Back to Lost & Found
                </button>

                {/* Status Badge */}
                <div className="mb-4">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        pet.status === 'lost' ? 'bg-red-100 text-red-800' :
                        pet.status === 'found' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        {pet.status.toUpperCase()}
                    </span>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-96 overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
                                <img
                                    src={getImageUrl(selectedImage)}
                                    alt={pet.petName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        console.error('Failed to load image:', e.target.src);
                                        e.target.src = '/images/default-pet.jpg';
                                    }}
                                />
                            </div>
                            {pet.images.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {pet.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                                                selectedImage === index ? 'border-teal-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={getImageUrl(index)}
                                                alt={`${pet.petName} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error('Failed to load thumbnail:', e.target.src);
                                                    e.target.src = '/images/default-pet.jpg';
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pet Information */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">{pet.petName}</h1>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-teal-50 p-3 rounded-lg">
                                    <span className="text-sm text-teal-600 font-medium">Type</span>
                                    <p className="font-semibold text-gray-800">{pet.petType}</p>
                                </div>
                                <div className="bg-cyan-50 p-3 rounded-lg">
                                    <span className="text-sm text-cyan-600 font-medium">Breed</span>
                                    <p className="font-semibold text-gray-800">{pet.breed}</p>
                                </div>
                                <div className="bg-teal-50 p-3 rounded-lg">
                                    <span className="text-sm text-teal-600 font-medium">Color</span>
                                    <p className="font-semibold text-gray-800">{pet.color}</p>
                                </div>
                                <div className="bg-cyan-50 p-3 rounded-lg">
                                    <span className="text-sm text-cyan-600 font-medium">Age</span>
                                    <p className="font-semibold text-gray-800">{pet.age}</p>
                                </div>
                                <div className="bg-teal-50 p-3 rounded-lg">
                                    <span className="text-sm text-teal-600 font-medium">Gender</span>
                                    <p className="font-semibold text-gray-800 capitalize">{pet.gender}</p>
                                </div>
                            </div>

                            <div className="border-t border-teal-100 pt-4 mb-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed">{pet.description}</p>
                            </div>

                            {pet.distinguishingFeatures && (
                                <div className="border-t border-teal-100 pt-4 mb-4">
                                    <h3 className="font-semibold text-gray-800 mb-2">Distinguishing Features</h3>
                                    <p className="text-gray-600 leading-relaxed">{pet.distinguishingFeatures}</p>
                                </div>
                            )}

                            <div className="border-t border-teal-100 pt-4">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-teal-500" />
                                    Last Seen Location
                                </h3>
                                <p className="text-gray-600">{pet.lastSeenLocation.address}</p>
                                <p className="text-gray-600">{pet.lastSeenLocation.city}, {pet.lastSeenLocation.state}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                    <FaCalendarAlt />
                                    <span>Last seen: {formatDate(pet.lastSeenDate)}</span>
                                </div>
                            </div>

                            {pet.rewardOffered && (
                                <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                                    <p className="text-yellow-800 font-semibold">
                                        💰 Reward Offered: ₹{pet.rewardAmount}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <FaComment className="text-teal-500" />
                                    Comments ({pet.comments?.length || 0})
                                </h2>
                                {isAuthenticated && (
                                    <button
                                        onClick={() => setShowCommentForm(!showCommentForm)}
                                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors font-semibold"
                                    >
                                        Add Comment
                                    </button>
                                )}
                            </div>

                            {showCommentForm && (
                                <form onSubmit={handleCommentSubmit} className="mb-6 bg-teal-50 p-4 rounded-lg">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Share any information about this pet..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none resize-none"
                                        rows="4"
                                        required
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            type="submit"
                                            disabled={submittingComment}
                                            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50"
                                        >
                                            {submittingComment ? 'Posting...' : 'Post Comment'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCommentForm(false);
                                                setComment('');
                                            }}
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-4">
                                {pet.comments && pet.comments.length > 0 ? (
                                    pet.comments.map((comment, index) => (
                                        <div key={index} className="border-b border-teal-100 pb-4 last:border-b-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <FaUser className="text-teal-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-800">
                                                            {comment.user?.fullName || 'Anonymous'}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700">{comment.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FaComment className="text-4xl text-gray-300 mx-auto mb-2" />
                                        <p>No comments yet. Be the first to comment!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-6">
                            <h3 className="text-xl font-bold text-gray-800">Contact Information</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-600 bg-teal-50 p-3 rounded-lg">
                                    <FaUser className="text-teal-500 text-xl" />
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-semibold text-gray-800">{pet.contactInfo.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600 bg-cyan-50 p-3 rounded-lg">
                                    <FaPhone className="text-cyan-500 text-xl" />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <a href={`tel:${pet.contactInfo.phone}`} className="font-semibold text-gray-800 hover:text-teal-600">
                                            {pet.contactInfo.phone}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600 bg-teal-50 p-3 rounded-lg">
                                    <FaEnvelope className="text-teal-500 text-xl" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <a href={`mailto:${pet.contactInfo.email}`} className="font-semibold text-gray-800 hover:text-teal-600 break-all">
                                            {pet.contactInfo.email}
                                        </a>
                                    </div>
                                </div>

                                {pet.contactInfo.alternatePhone && (
                                    <div className="flex items-center gap-3 text-gray-600 bg-cyan-50 p-3 rounded-lg">
                                        <FaPhone className="text-cyan-500 text-xl" />
                                        <div>
                                            <p className="text-xs text-gray-500">Alternate Phone</p>
                                            <a href={`tel:${pet.contactInfo.alternatePhone}`} className="font-semibold text-gray-800 hover:text-teal-600">
                                                {pet.contactInfo.alternatePhone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isOwner && pet.status === 'lost' && (
                                <div className="border-t border-teal-100 pt-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">Update Status</h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleStatusUpdate('found')}
                                            className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition-colors font-semibold"
                                        >
                                            Mark as Found
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('reunited')}
                                            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors font-semibold"
                                        >
                                            Mark as Reunited
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-teal-100 pt-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <FaClock />
                                    <span>Posted: {formatDate(pet.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                    <FaPaw />
                                    <span>{pet.views || 0} views</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LostPetDetail;
