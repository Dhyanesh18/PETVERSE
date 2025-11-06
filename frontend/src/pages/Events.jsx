import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUserFriends, FaSpinner, FaCalendarTimes, FaPlusCircle } from 'react-icons/fa';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all',
        feeType: 'all',
        city: '',
        date: ''
    });
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadEvents();
    }, [filters]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            
            // Build query params
            const params = {};
            if (filters.category !== 'all') params.category = filters.category;
            if (filters.feeType !== 'all') params.feeType = filters.feeType;
            if (filters.city) params.city = filters.city;
            if (filters.date) params.date = filters.date;

            const response = await getEvents(params);
            const eventsData = response.data.data?.events || response.data.events || [];
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            feeType: 'all',
            city: '',
            date: ''
        });
    };

    const handleEventClick = (eventId) => {
        navigate(`/events/${eventId}`);
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    return (
        <div className="bg-gray-50 min-h-screen pt-20">
            {/* Hero Section */}
            <section 
                className="text-white py-20 px-5 text-center mt-0 relative overflow-hidden bg-cover bg-center"
                style={{
                    background: `linear-gradient(135deg, rgba(102, 201, 234, 0.5) 0%, rgba(75, 162, 162, 0.3) 100%), url('/images/dog-event.png') no-repeat center center`,
                    backgroundSize: 'cover'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Pet Events & Activities</h1>
                    <p className="text-xl text-teal-50">Join exciting pet events, workshops, and meetups in your city</p>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:w-64 shrink-0">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Filters</h2>
                            
                            {/* Category Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Category</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'all', label: 'All Events' },
                                        { value: 'Workshop', label: 'Workshop' },
                                        { value: 'Adoption Drive', label: 'Adoption Drive' },
                                        { value: 'Pet Show', label: 'Pet Show' },
                                        { value: 'Competition', label: 'Competition' }
                                    ].map(cat => (
                                        <label key={cat.value} className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="category"
                                                value={cat.value}
                                                checked={filters.category === cat.value}
                                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                                className="mr-2 text-teal-500 focus:ring-teal-500"
                                            />
                                            <span className="text-gray-700">{cat.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Fee Type Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Entry Fee</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'all', label: 'All Events' },
                                        { value: 'free', label: 'Free Events' },
                                        { value: 'paid', label: 'Paid Events' }
                                    ].map(fee => (
                                        <label key={fee.value} className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="feeType"
                                                value={fee.value}
                                                checked={filters.feeType === fee.value}
                                                onChange={(e) => handleFilterChange('feeType', e.target.value)}
                                                className="mr-2 text-teal-500 focus:ring-teal-500"
                                            />
                                            <span className="text-gray-700">{fee.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* City Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
                                <input
                                    type="text"
                                    placeholder="Enter city"
                                    value={filters.city}
                                    onChange={(e) => handleFilterChange('city', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Date Filter */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-700 mb-3">Date</h3>
                                <input
                                    type="date"
                                    value={filters.date}
                                    min={getTodayDate()}
                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <button
                                onClick={clearFilters}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md transition duration-200"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>

                    {/* Events Grid */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Upcoming Events <span className="text-teal-600">({events.length})</span>
                                </h2>
                                {user && user.role === 'service_provider' && (
                                    <button
                                        onClick={() => navigate('/events/add')}
                                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                                    >
                                        <FaPlusCircle /> Create Event
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <FaSpinner className="text-5xl text-teal-500 animate-spin mb-4" />
                                <p className="text-gray-600 text-lg">Loading events...</p>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-md">
                                <FaCalendarTimes className="text-6xl text-gray-400 mb-4" />
                                <p className="text-gray-600 text-lg">No events found matching your criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {events.map(event => (
                                    <div
                                        key={event._id}
                                        onClick={() => handleEventClick(event._id)}
                                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className="p-6">
                                            {/* Header with badges */}
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">
                                                    {event.category}
                                                </span>
                                                {event.isFull && (
                                                    <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                                                        FULL
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                                                {event.title}
                                            </h3>

                                            {/* Meta Information */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-gray-600 text-sm">
                                                    <FaCalendar className="mr-2 text-teal-500" />
                                                    <span>{event.formattedDate}</span>
                                                </div>
                                                <div className="flex items-center text-gray-600 text-sm">
                                                    <FaClock className="mr-2 text-teal-500" />
                                                    <span>{event.startTime} - {event.endTime}</span>
                                                </div>
                                                <div className="flex items-center text-gray-600 text-sm">
                                                    <FaMapMarkerAlt className="mr-2 text-teal-500" />
                                                    <span>{event.location?.city}</span>
                                                </div>
                                                <div className="flex items-center text-gray-600 text-sm">
                                                    <FaUserFriends className="mr-2 text-teal-500" />
                                                    <span>{event.availableSlots} slots left</span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                {event.description}
                                            </p>

                                            {/* Footer */}
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                                <div className="text-lg font-bold">
                                                    {event.entryFee === 0 ? (
                                                        <span className="text-green-600">FREE</span>
                                                    ) : (
                                                        <span className="text-gray-800">₹{event.entryFee}</span>
                                                    )}
                                                </div>
                                                <button className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1">
                                                    View Details →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Events;
