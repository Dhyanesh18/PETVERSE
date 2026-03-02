import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getServiceProviderDashboard, updateBookingStatus } from '../services/serviceProviderService';
import { FaStar, FaCommentAlt, FaCalendarCheck, FaHistory, FaUser, FaEnvelope, FaIdCard, FaBriefcase, FaPhone, FaCalendar, FaPlusCircle, FaSignOutAlt, FaPaw, FaCalendarTimes, FaHome, FaChartBar, FaWallet, FaCog, FaBars, FaTimes, FaBan, FaCalendarAlt, FaUsers, FaTrophy, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import ScheduleManager from '../components/ScheduleManager';
import { ServiceProviderDashboardSkeleton } from '../components/Skeleton';

const ServiceProviderDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [analyticsFilter, setAnalyticsFilter] = useState('all');

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getServiceProviderDashboard();
            console.log('Dashboard data:', response.data);
            
            if (response.data.success) {
                setDashboardData(response.data.data);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setError(error.response?.data?.message || 'Failed to load dashboard');
            
            if (error.response?.status === 401) {
                navigate('/login');
            } else if (error.response?.status === 403) {
                navigate('/unauthorized');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            setCancellingBooking(bookingId);
            await updateBookingStatus(bookingId, 'cancelled');
            
            // Refresh dashboard data
            await fetchDashboardData();
            
            alert('Booking cancelled successfully');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancellingBooking(null);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const { provider, statistics, bookings, recentReviews } = dashboardData || {};

    // ── Analytics computations ─────────────────────────────────────────────
    // useMemo must be called unconditionally (Rules of Hooks), so it lives
    // before any early returns. Null-safe guards handle the loading/error cases.
    const analyticsData = useMemo(() => {
        const allPast = bookings?.past || [];
        const allUpcoming = bookings?.upcoming || [];
        const allBookings = [...allPast, ...allUpcoming];

        const now = new Date();
        const filterDate = (d) => {
            if (analyticsFilter === 'month') {
                const cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
                return new Date(d) >= cutoff;
            }
            if (analyticsFilter === '3months') {
                const cutoff = new Date(now);
                cutoff.setMonth(cutoff.getMonth() - 3);
                return new Date(d) >= cutoff;
            }
            return true;
        };

        const filtered = allBookings.filter(b => filterDate(b.date));
        const filteredPast = allPast.filter(b => filterDate(b.date));

        // Unique customers from filtered past bookings
        const customerMap = {};
        filteredPast.forEach(b => {
            const id = b.customer?.email || b.customer?.name || 'unknown';
            if (!customerMap[id]) {
                customerMap[id] = {
                    name: b.customer?.name || 'Customer',
                    email: b.customer?.email || '—',
                    lastBooking: b.date,
                    totalBookings: 0,
                    status: b.status,
                };
            }
            customerMap[id].totalBookings += 1;
            if (new Date(b.date) > new Date(customerMap[id].lastBooking)) {
                customerMap[id].lastBooking = b.date;
                customerMap[id].status = b.status;
            }
        });
        const customers = Object.values(customerMap).sort(
            (a, b) => new Date(b.lastBooking) - new Date(a.lastBooking)
        );

        // Status breakdown
        const completed = filtered.filter(b => b.status === 'completed' || b.status === 'Completed').length;
        const cancelled = filtered.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;
        const confirmed = filtered.filter(b => b.status === 'confirmed' || b.status === 'Confirmed').length;
        const pending = filtered.length - completed - cancelled - confirmed;

        // Monthly trend (last 6 months)
        const monthTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString('default', { month: 'short' });
            const count = allBookings.filter(b => {
                const bd = new Date(b.date);
                return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
            }).length;
            monthTrend.push({ label, count });
        }
        const maxTrend = Math.max(...monthTrend.map(m => m.count), 1);

        // Revenue estimate for filtered period (using per-booking avg from statistics)
        const pricePerBooking = statistics?.estimatedRevenue && statistics?.completedBookings
            ? (parseFloat(statistics.estimatedRevenue) / statistics.completedBookings)
            : 0;
        const filteredRevenue = (completed * pricePerBooking).toFixed(2);

        return { filtered, customers, completed, cancelled, confirmed, pending, monthTrend, maxTrend, filteredRevenue };
    }, [bookings, analyticsFilter, statistics]);

    // Early returns AFTER all hooks
    if (loading) return <ServiceProviderDashboardSkeleton />;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const sidebarItems = [
        { id: 'overview', icon: FaHome, label: 'Overview', description: 'Dashboard Summary' },
        { id: 'profile', icon: FaUser, label: 'Profile', description: 'Your Information' },
        { id: 'schedule', icon: FaCalendarAlt, label: 'Schedule', description: 'Manage Availability' },
        { id: 'upcoming', icon: FaCalendarCheck, label: 'Upcoming', description: 'Future Bookings' },
        { id: 'history', icon: FaHistory, label: 'History', description: 'Past Bookings' },
        { id: 'reviews', icon: FaCommentAlt, label: 'Reviews', description: 'Customer Feedback' },
        { id: 'analytics', icon: FaChartBar, label: 'Analytics', description: 'Performance Stats' },
    ];

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="flex relative">
                {/* Sidebar */}
                <aside className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white shadow-lg transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'} overflow-hidden`}>
                    {/* Toggle Button - Only shown when sidebar is open */}
                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute right-4 top-4 bg-teal-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-teal-700 transition-all hover:scale-110 z-50"
                            title="Close navigation"
                        >
                            <FaTimes size={16} />
                        </button>
                    )}

                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-gray-200">
                        {sidebarOpen ? (
                            <div>
                                <h2 className="font-bold text-lg text-gray-800">Navigation</h2>
                                <p className="text-sm text-gray-500">Quick Access</p>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <FaBars className="text-gray-600" size={20} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar Navigation */}
                    <nav className="p-2 overflow-y-auto h-[calc(100%-80px)]">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                                    activeSection === item.id
                                        ? 'bg-teal-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
                                }`}
                            >
                                <item.icon className="text-xl flex-shrink-0" />
                                <div className="text-left">
                                    <div className="font-semibold text-sm">{item.label}</div>
                                    <div className={`text-xs ${activeSection === item.id ? 'text-teal-100' : 'text-gray-500'}`}>
                                        {item.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    {sidebarOpen && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <FaSignOutAlt />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    )}
                </aside>

                {/* Floating Toggle Button - Only shown when sidebar is closed */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="fixed left-4 top-24 bg-teal-600 text-white rounded-full p-3 shadow-lg hover:bg-teal-700 transition-all z-50 hover:scale-110"
                        title="Open Navigation"
                    >
                        <FaBars size={18} />
                    </button>
                )}

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Dashboard Header */}
                        <header id="overview" className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <span className="text-teal-600">PetVerse</span>
                                    <span className="text-green-600">Service Provider Dashboard</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-gray-700 font-semibold">
                                        Welcome, {provider?.name || user?.fullName || 'Provider'}
                                    </span>
                                    {user?.role === 'service_provider' && (
                                        <Link
                                            to="/events/add"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all hover:scale-105 font-medium shadow-md"
                                        >
                                            <FaPlusCircle />
                                            Create Event
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <FaStar className="text-4xl text-teal-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            {statistics?.averageRating || '0'}/5
                        </div>
                        <div className="text-sm text-gray-500">Average Rating</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <FaCommentAlt className="text-4xl text-green-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            {statistics?.totalReviews || '0'}
                        </div>
                        <div className="text-sm text-gray-500">Total Reviews</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <FaCalendarCheck className="text-4xl text-teal-500 mb-3" />
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            {statistics?.upcomingBookings || '0'}
                        </div>
                        <div className="text-sm text-gray-500">Upcoming Bookings</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <FaHistory className="text-4xl text-cyan-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                            {statistics?.completedBookings || '0'}
                        </div>
                        <div className="text-sm text-gray-500">Completed Bookings</div>
                            </div>
                        </div>

                        {/* Profile Section */}
                        <section id="profile" className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 scroll-mt-24">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaUser className="text-teal-600" />
                                    Profile Information
                                </h2>
                            </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1">
                                <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaUser />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Name</div>
                                    <div className="font-semibold text-gray-800">
                                        {provider?.name || user?.fullName || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1">
                                <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaEnvelope />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Email Address</div>
                                    <div className="font-semibold text-gray-800 break-all">
                                        {provider?.email || user?.email || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1">
                                <div className="w-10 h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaIdCard />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Username</div>
                                    <div className="font-semibold text-gray-800">
                                        {user?.username || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1">
                                <div className="w-10 h-10 bg-teal-700 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaBriefcase />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Role</div>
                                    <div className="font-semibold text-gray-800">Service Provider</div>
                                </div>
                            </div>
                            
                            {user?.phone && (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1">
                                    <div className="w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                        <FaPhone />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Phone Number</div>
                                        <div className="font-semibold text-gray-800">{user.phone}</div>
                                    </div>
                                </div>
                            )}
                            
                            {user?.createdAt && (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1">
                                    <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                        <FaCalendar />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Member Since</div>
                                        <div className="font-semibold text-gray-800">
                                            {formatDate(user.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                            </div>
                        </section>

                        {/* Schedule Manager Section */}
                        <section id="schedule" className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 scroll-mt-24">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaCalendarAlt className="text-teal-600" />
                                    Manage Availability
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Set your weekly working hours with flexible time ranges, and block specific dates when you are unavailable.
                                </p>
                            </div>
                            <ScheduleManager />
                        </section>

                        {/* Upcoming Bookings Section */}
                        <section id="upcoming" className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 scroll-mt-24">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaCalendarCheck className="text-teal-600" />
                                    Upcoming Bookings
                                </h2>
                            </div>
                    <div className="overflow-x-auto">
                        {bookings?.upcoming && bookings.upcoming.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Time Slot</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Customer</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.upcoming.map((booking, index) => (
                                        <tr key={booking._id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-700">{formatDate(booking.date)}</td>
                                            <td className="p-4 text-gray-700">{booking.slot || booking.time || 'N/A'}</td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        {booking.customer?.name || 'Customer'}
                                                    </div>
                                                    {booking.customer?.email && (
                                                        <div className="text-sm text-gray-500">
                                                            {booking.customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                    booking.status === 'cancelled' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-teal-100 text-teal-800'
                                                }`}>
                                                    {booking.status || 'Confirmed'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {booking.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancelBooking(booking._id)}
                                                        disabled={cancellingBooking === booking._id}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                        title="Cancel booking"
                                                    >
                                                        <FaBan size={14} />
                                                        {cancellingBooking === booking._id ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12">
                                <FaCalendarTimes className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No upcoming bookings found</p>
                            </div>
                        )}
                            </div>
                        </section>

                        {/* Past Bookings Section */}
                        <section id="history" className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 scroll-mt-24">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaHistory className="text-teal-600" />
                                    Past Bookings
                                </h2>
                            </div>
                    <div className="overflow-x-auto">
                        {bookings?.past && bookings.past.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Time Slot</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Customer</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.past.map((booking, index) => (
                                        <tr key={booking._id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-700">{formatDate(booking.date)}</td>
                                            <td className="p-4 text-gray-700">{booking.slot || booking.time || 'N/A'}</td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        {booking.customer?.name || 'Customer'}
                                                    </div>
                                                    {booking.customer?.email && (
                                                        <div className="text-sm text-gray-500">
                                                            {booking.customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                    {booking.status || 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12">
                                <FaCalendarTimes className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No past bookings found</p>
                            </div>
                        )}
                            </div>
                        </section>

                        {/* Recent Reviews Section */}
                        {recentReviews && recentReviews.length > 0 && (
                            <section id="reviews" className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 scroll-mt-24">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                        <FaCommentAlt className="text-teal-500" />
                                        Recent Reviews
                                    </h2>
                                </div>
                        <div className="space-y-4">
                            {recentReviews.map((review, index) => (
                                <div key={review._id || index} className="border-b border-gray-100 pb-4 last:border-b-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                {review.user?.name || 'Customer'}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar
                                                        key={i}
                                                        className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(review.createdAt)}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 mt-2">{review.comment}</p>
                                    )}
                                </div>
                            ))}
                                </div>
                            </section>
                        )}

                        {/* Analytics Section */}
                        <section id="analytics" className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 scroll-mt-24">
                            {/* Header + Filter */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaChartBar className="text-yellow-600" />
                                    Analytics & Performance
                                </h2>
                                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                                    {[
                                        { key: 'month', label: 'This Month' },
                                        { key: '3months', label: 'Last 3 Months' },
                                        { key: 'all', label: 'All Time' },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setAnalyticsFilter(f.key)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                analyticsFilter === f.key
                                                    ? 'bg-white text-teal-700 shadow font-semibold'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="p-5 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                                    <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-1">Bookings</p>
                                    <p className="text-3xl font-bold text-teal-700">{analyticsData.filtered.length}</p>
                                    <p className="text-xs text-gray-500 mt-1">{analyticsFilter === 'month' ? 'This month' : analyticsFilter === '3months' ? 'Last 3 months' : 'All time'}</p>
                                </div>
                                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Completed</p>
                                    <p className="text-3xl font-bold text-green-700">{analyticsData.completed}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {analyticsData.filtered.length
                                            ? `${Math.round((analyticsData.completed / analyticsData.filtered.length) * 100)}% completion rate`
                                            : 'No bookings'}
                                    </p>
                                </div>
                                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                    <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Client Reach</p>
                                    <p className="text-3xl font-bold text-purple-700">{analyticsData.customers.length}</p>
                                    <p className="text-xs text-gray-500 mt-1">In selected period</p>
                                </div>
                                <div className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                                    <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide mb-1">Avg Rating</p>
                                    <p className="text-3xl font-bold text-yellow-700">{statistics?.averageRating || '—'}</p>
                                    <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
                                </div>
                            </div>

                            {/* Booking Trend + Status Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Monthly Trend */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FaCalendarAlt className="text-teal-500" /> Monthly Booking Trend
                                    </h3>
                                    <div className="flex items-end gap-2 h-36">
                                        {analyticsData.monthTrend.map((m, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs font-medium text-teal-700">
                                                    {m.count > 0 ? m.count : ''}
                                                </span>
                                                <div
                                                    className="w-full rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 transition-all duration-500"
                                                    style={{ height: `${Math.max((m.count / analyticsData.maxTrend) * 100, m.count > 0 ? 8 : 2)}%` }}
                                                />
                                                <span className="text-xs text-gray-500">{m.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Breakdown */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FaTrophy className="text-yellow-500" /> Booking Status Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Completed', count: analyticsData.completed, color: 'bg-green-500' },
                                            { label: 'Confirmed', count: analyticsData.confirmed, color: 'bg-teal-500' },
                                            { label: 'Pending', count: analyticsData.pending, color: 'bg-yellow-400' },
                                            { label: 'Cancelled', count: analyticsData.cancelled, color: 'bg-red-400' },
                                        ].map(s => {
                                            const total = analyticsData.filtered.length || 1;
                                            const pct = Math.round((s.count / total) * 100);
                                            return (
                                                <div key={s.label}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 font-medium">{s.label}</span>
                                                        <span className="text-gray-500">{s.count} ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className={`h-2.5 rounded-full ${s.color} transition-all duration-500`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                <div className="p-5 bg-white border border-gray-200 rounded-xl">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Wallet Balance</p>
                                    <p className="text-2xl font-bold text-green-600">₹{statistics?.walletBalance || '0.00'}</p>
                                    <p className="text-xs text-gray-400 mt-1">Available</p>
                                </div>
                                <div className="p-5 bg-white border border-gray-200 rounded-xl">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-cyan-600">₹{statistics?.estimatedRevenue || '0.00'}</p>
                                    <p className="text-xs text-gray-400 mt-1">All time earnings</p>
                                </div>
                                <div className="p-5 bg-white border border-gray-200 rounded-xl">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Period Revenue</p>
                                    <p className="text-2xl font-bold text-purple-600">₹{analyticsData.filteredRevenue}</p>
                                    <p className="text-xs text-gray-400 mt-1">{analyticsFilter === 'month' ? 'This month' : analyticsFilter === '3months' ? 'Last 3 months' : 'All time'}</p>
                                </div>
                            </div>

                            {/* Recent Customers */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <FaUsers className="text-purple-500" /> Recent Customers
                                    <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                        {analyticsData.customers.length}
                                    </span>
                                </h3>
                                {analyticsData.customers.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Booking</th>
                                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analyticsData.customers.slice(0, 10).map((c, i) => (
                                                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="p-4 text-gray-400 font-medium">{i + 1}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                    {c.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-gray-800">{c.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-gray-500">{c.email}</td>
                                                        <td className="p-4 text-gray-600">{formatDate(c.lastBooking)}</td>
                                                        <td className="p-4">
                                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold text-xs">
                                                                {c.totalBookings}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                c.status === 'completed' || c.status === 'Completed'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : c.status === 'cancelled' || c.status === 'Cancelled'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-teal-100 text-teal-700'
                                                            }`}>
                                                                {c.status || 'Confirmed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                                        <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No customer data for this period</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ServiceProviderDashboard;
