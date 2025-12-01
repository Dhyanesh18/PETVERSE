import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, registerForEvent, unregisterFromEvent } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
    FaCalendarAlt, 
    FaClock, 
    FaMapMarkerAlt, 
    FaTicketAlt, 
    FaUsers, 
    FaUser, 
    FaEnvelope, 
    FaPhone,
    FaCheckCircle,
    FaBan,
    FaUserLock,
    FaSpinner,
    FaCalendarCheck,
    FaUserFriends,
    FaGift
} from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [event, setEvent] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [availableSlots, setAvailableSlots] = useState(0);
    const [isFull, setIsFull] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        numberOfPets: 1,
        specialRequirements: ''
    });

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    useEffect(() => {
        console.log('EventDetail - User state:', user);
        console.log('EventDetail - Auth loading:', authLoading);
    }, [user, authLoading]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await getEventById(id);
            const data = response.data.data;
            
            setEvent(data.event);
            setIsRegistered(data.isRegistered);
            setAvailableSlots(data.availableSlots);
            setIsFull(data.isFull);
        } catch (error) {
            console.error('Failed to fetch event details:', error);
            alert('Failed to load event details');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            setSubmitting(true);
            const response = await registerForEvent({
                eventId: id,
                numberOfPets: parseInt(formData.numberOfPets),
                specialRequirements: formData.specialRequirements
            });

            if (response.data.success) {
                const data = response.data.data;
                // Check if payment is required
                if (data.requiresPayment || data.entryFee > 0) {
                    navigate(`/events/${id}/payment`);
                } else {
                    navigate(`/events/${id}/ticket`);
                }
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert(error.response?.data?.error || 'Failed to register for event');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnregister = async () => {
        if (!confirm('Are you sure you want to unregister from this event?')) {
            return;
        }

        try {
            setSubmitting(true);
            const response = await unregisterFromEvent(id);
            
            if (response.data.success) {
                alert('Successfully unregistered from event');
                fetchEventDetails(); // Refresh data
            }
        } catch (error) {
            console.error('Unregister failed:', error);
            alert(error.response?.data?.error || 'Failed to unregister from event');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FaSpinner className="text-6xl text-teal-500 animate-spin mx-auto mb-4" />
                    <p className="text-xl text-gray-700">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-xl text-gray-700">Event not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pt-24 pb-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Details */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            {/* Header */}
                            <div className="mb-6">
                                <span className="inline-block bg-teal-100 text-teal-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                                    {event.category}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{event.title}</h1>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <FaCalendarAlt className="text-2xl text-teal-500 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Date</h4>
                                        <p className="text-gray-600 text-sm">{formatDate(event.eventDate)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <FaClock className="text-2xl text-teal-500 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Time</h4>
                                        <p className="text-gray-600 text-sm">{event.startTime} - {event.endTime}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <FaMapMarkerAlt className="text-2xl text-teal-500 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Location</h4>
                                        <p className="text-gray-600 text-sm">{event.location?.venue}</p>
                                        <p className="text-gray-500 text-xs">{event.location?.address}, {event.location?.city}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <FaTicketAlt className="text-2xl text-teal-500 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Entry Fee</h4>
                                        <p className="text-gray-600 text-sm font-bold">
                                            {event.entryFee === 0 ? (
                                                <span className="text-green-600">FREE</span>
                                            ) : (
                                                `₹${event.entryFee}`
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <FaUsers className="text-2xl text-teal-500 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Available Slots</h4>
                                        <p className="text-gray-600 text-sm">{availableSlots} / {event.maxAttendees}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <FaUser className="text-2xl text-teal-500 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Organizer</h4>
                                        <p className="text-gray-600 text-sm">{event.organizer?.fullName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">About This Event</h3>
                                <p className="text-gray-600 leading-relaxed">{event.description}</p>
                            </div>

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {event.tags.map((tag, index) => (
                                            <span key={index} className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact Information */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
                                <div className="space-y-2">
                                    <p className="flex items-center text-gray-600">
                                        <FaEnvelope className="mr-2 text-teal-500" />
                                        {event.contactEmail}
                                    </p>
                                    {event.contactPhone && (
                                        <p className="flex items-center text-gray-600">
                                            <FaPhone className="mr-2 text-teal-500" />
                                            {event.contactPhone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Sidebar */}
                    <div className="lg:w-96 shrink-0">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            {!user ? (
                                <div className="text-center py-8">
                                    <FaUserLock className="text-5xl text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">Please login to register for this event</p>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
                                    >
                                        Login
                                    </button>
                                </div>
                            ) : isFull ? (
                                <div className="text-center py-8">
                                    <FaBan className="text-5xl text-red-500 mx-auto mb-4" />
                                    <p className="text-gray-600 font-semibold">This event is fully booked</p>
                                </div>
                            ) : isRegistered ? (
                                <div className="text-center py-8">
                                    <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                                    <p className="text-gray-800 font-semibold mb-4">You are registered for this event!</p>
                                    <button
                                        onClick={handleUnregister}
                                        disabled={submitting}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : 'Unregister'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Register for Event</h3>
                                    <form onSubmit={handleRegister}>
                                        <div className="mb-4">
                                            <label htmlFor="numberOfPets" className="block text-gray-700 font-semibold mb-2">
                                                Number of Pets
                                            </label>
                                            <input
                                                type="number"
                                                id="numberOfPets"
                                                name="numberOfPets"
                                                min="1"
                                                max="5"
                                                value={formData.numberOfPets}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="specialRequirements" className="block text-gray-700 font-semibold mb-2">
                                                Special Requirements (Optional)
                                            </label>
                                            <textarea
                                                id="specialRequirements"
                                                name="specialRequirements"
                                                rows="3"
                                                value={formData.specialRequirements}
                                                onChange={handleInputChange}
                                                placeholder="Any special needs or requirements..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <FaCalendarCheck />
                                            {submitting ? 'Processing...' : 'Register Now'}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* Quick Info */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3">Quick Info</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center text-gray-600 text-sm">
                                        <FaUserFriends className="mr-2 text-teal-500" />
                                        {event.attendees?.length || 0} people registered
                                    </li>
                                    <li className="flex items-center text-gray-600 text-sm">
                                        <FaClock className="mr-2 text-teal-500" />
                                        {availableSlots} slots remaining
                                    </li>
                                    {event.entryFee === 0 && (
                                        <li className="flex items-center text-gray-600 text-sm">
                                            <FaGift className="mr-2 text-teal-500" />
                                            Free entry
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
