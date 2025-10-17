import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getServiceProviderDashboard } from '../services/api';

const ServiceProviderDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await getServiceProviderDashboard();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
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

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="text-2xl text-gray-600">Failed to load dashboard</div>
                    </div>
                </div>
            </div>
        );
    }

    const { user, averageRating = 0, totalReviews = 0, futureBookings = [], pastBookings = [] } = dashboardData;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Dashboard Header */}
                <header className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">
                            <span className="bg-gradient-to-r from-indigo-600 to-green-600 bg-clip-text text-transparent">
                                PetVerse Service Provider Dashboard
                            </span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium">Welcome, {user?.fullName || user?.username || 'Provider'}</span>
                            {user?.role === 'service_provider' && (
                                <Link
                                    to="/events/add/new"
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <i className="fas fa-plus-circle"></i>
                                    Create Event
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-star text-yellow-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{averageRating}/5</div>
                                <div className="text-gray-600 text-sm">Average Rating</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-comment-alt text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{totalReviews}</div>
                                <div className="text-gray-600 text-sm">Total Reviews</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-calendar-check text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{futureBookings.length}</div>
                                <div className="text-gray-600 text-sm">Upcoming Bookings</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-history text-purple-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{pastBookings.length}</div>
                                <div className="text-gray-600 text-sm">Past Bookings</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-user-circle text-blue-500 mr-3"></i>
                        Profile Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-user text-blue-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Name</div>
                                <div className="text-gray-800 font-medium">{user?.fullName || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-envelope text-green-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Email Address</div>
                                <div className="text-gray-800 font-medium">{user?.email || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-id-card text-purple-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Username</div>
                                <div className="text-gray-800 font-medium">{user?.username || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-briefcase text-indigo-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Role</div>
                                <div className="text-gray-800 font-medium">Service Provider</div>
                            </div>
                        </div>

                        {user?.phone && (
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className="fas fa-phone text-yellow-600"></i>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                                    <div className="text-gray-800 font-medium">{user.phone}</div>
                                </div>
                            </div>
                        )}

                        {user?.joinedDate && (
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className="fas fa-calendar text-pink-600"></i>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Member Since</div>
                                    <div className="text-gray-800 font-medium">{user.joinedDate}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Future Bookings */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-calendar-check text-green-500 mr-3"></i>
                        Future Bookings
                    </h2>

                    {futureBookings.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {futureBookings.map((booking, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{booking.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{booking.slot}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {booking.user?.fullName || booking.user?.username || 'Unknown User'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="far fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500 text-lg">No future bookings found</p>
                        </div>
                    )}
                </section>

                {/* Past Bookings */}
                <section className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-history text-purple-500 mr-3"></i>
                        Past Bookings
                    </h2>

                    {pastBookings.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pastBookings.map((booking, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{booking.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{booking.slot}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {booking.user?.fullName || booking.user?.username || 'Unknown User'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="far fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500 text-lg">No past bookings found</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ServiceProviderDashboard;