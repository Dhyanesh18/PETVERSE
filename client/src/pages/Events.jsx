import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { getEvents } from '../services/api';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await getEvents();
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        if (filter === 'upcoming') return eventDate >= today;
        if (filter === 'past') return eventDate < today;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Hero */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 mb-8 text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Pet Events</h1>
                    <p className="text-xl text-purple-100">Join exciting events for you and your pets</p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-8">
                    {['all', 'upcoming', 'past'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2 rounded-lg font-medium transition ${
                                filter === f
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Loading events...</div>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <Link
                                key={event._id}
                                to={`/events/${event._id}`}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                            >
                                {event.image ? (
                                    <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                        <i className="fas fa-calendar-alt text-6xl text-white opacity-80"></i>
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                                            {event.category}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(event.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>{event.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <i className="fas fa-clock"></i>
                                            <span>{event.startTime}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-bold text-purple-600">₹{event.price}</span>
                                            <span className="text-sm text-gray-500">
                                                {event.availableSeats} seats left
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-lg">
                        <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-500 text-lg">No events found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;