import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getEventById, registerForEvent } from '../services/api';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState(1);

    useEffect(() => {
        fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await getEventById(id);
            setEvent(response.data.event);
        } catch (error) {
            console.error('Failed to fetch event details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            await registerForEvent(id, { tickets });
            alert('Registration successful!');
            navigate('/owner-dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
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

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Event not found</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-96 object-cover" />
                    ) : (
                        <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                            <i className="fas fa-calendar-alt text-9xl text-white opacity-80"></i>
                        </div>
                    )}
                    
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
                                {event.category}
                            </span>
                            <span className="text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">{event.title}</h1>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">{event.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <i className="fas fa-calendar text-purple-600 text-2xl mb-2"></i>
                                <p className="text-sm text-gray-500 mb-1">Date</p>
                                <p className="font-semibold">{new Date(event.date).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <i className="fas fa-clock text-purple-600 text-2xl mb-2"></i>
                                <p className="text-sm text-gray-500 mb-1">Time</p>
                                <p className="font-semibold">{event.startTime} - {event.endTime}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <i className="fas fa-map-marker-alt text-purple-600 text-2xl mb-2"></i>
                                <p className="text-sm text-gray-500 mb-1">Location</p>
                                <p className="font-semibold">{event.city}</p>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <p className="text-3xl font-bold text-purple-600 mb-2">₹{event.price} <span className="text-lg text-gray-500">per ticket</span></p>
                                    <p className="text-gray-600">{event.availableSeats} seats available</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setTickets(Math.max(1, tickets - 1))}
                                            className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            <i className="fas fa-minus"></i>
                                        </button>
                                        <span className="text-2xl font-bold w-12 text-center">{tickets}</span>
                                        <button
                                            onClick={() => setTickets(Math.min(event.availableSeats, tickets + 1))}
                                            className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleRegister}
                                        disabled={event.availableSeats === 0}
                                        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Register Now - ₹{event.price * tickets}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;