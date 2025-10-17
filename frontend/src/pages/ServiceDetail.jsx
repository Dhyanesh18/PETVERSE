import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getServiceById, bookService } from '../services/api';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState({
        date: '',
        time: '',
        notes: ''
    });

    useEffect(() => {
        fetchServiceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchServiceDetails = async () => {
        try {
            setLoading(true);
            const response = await getServiceById(id);
            setService(response.data.service);
        } catch (error) {
            console.error('Failed to fetch service details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        try {
            await bookService({ serviceId: id, ...bookingData });
            alert('Booking successful!');
            navigate('/owner-dashboard');
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Booking failed. Please try again.');
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

    if (!service) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Service not found</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Service Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-64 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                                <i className={`fas ${
                                    service.category === 'grooming' ? 'fa-cut' :
                                    service.category === 'veterinary' ? 'fa-stethoscope' :
                                    service.category === 'training' ? 'fa-graduation-cap' :
                                    service.category === 'boarding' ? 'fa-home' :
                                    service.category === 'walking' ? 'fa-walking' :
                                    'fa-paw'
                                } text-8xl text-white opacity-80`}></i>
                            </div>
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {service.category}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-star text-yellow-400"></i>
                                        <span className="font-bold">{service.rating || '5.0'}</span>
                                        <span className="text-gray-500">({service.reviews || 0} reviews)</span>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-4">{service.name}</h1>
                                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-500 text-sm mb-1">Price</p>
                                        <p className="text-2xl font-bold text-green-600">₹{service.price}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-500 text-sm mb-1">Duration</p>
                                        <p className="text-xl font-semibold text-gray-800">{service.duration || '1 hour'}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Service Provider</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                            <i className="fas fa-user text-green-600 text-2xl"></i>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{service.provider?.name || 'Professional Provider'}</p>
                                            <p className="text-sm text-gray-500">{service.provider?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Book This Service</h2>
                            <form onSubmit={handleBooking} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={bookingData.date}
                                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Time
                                    </label>
                                    <select
                                        required
                                        value={bookingData.time}
                                        onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">Choose time slot</option>
                                        <option value="09:00">09:00 AM</option>
                                        <option value="10:00">10:00 AM</option>
                                        <option value="11:00">11:00 AM</option>
                                        <option value="12:00">12:00 PM</option>
                                        <option value="14:00">02:00 PM</option>
                                        <option value="15:00">03:00 PM</option>
                                        <option value="16:00">04:00 PM</option>
                                        <option value="17:00">05:00 PM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={bookingData.notes}
                                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                        placeholder="Any special requirements..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                                >
                                    Book Now - ₹{service.price}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetail;