import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getAdminDashboard } from '../services/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [filters, setFilters] = useState({
        pet: true,
        product: true,
        service: true
    });

    useEffect(() => {
        fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await getAdminDashboard();
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

    const handleApprove = async (id, type) => {
        // TODO: Implement approve API
        console.log('Approve:', id, type);
        alert(`Approved ${type}: ${id}`);
    };

    const handleReject = async (id, type) => {
        // TODO: Implement reject API
        console.log('Reject:', id, type);
        alert(`Rejected ${type}: ${id}`);
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

    const {
        totalUsers = 0,
        totalProducts = 0,
        totalPets = 0,
        totalServices = 0,
        pendingApplications = [],
        approvedApplications = [],
        rejectedApplications = [],
        allUsers = [],
        recentOrders = []
    } = dashboardData;

    const renderDashboardOverview = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Users</p>
                            <p className="text-3xl font-bold mt-2">{totalUsers}</p>
                        </div>
                        <i className="fas fa-users text-4xl text-blue-200"></i>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Total Products</p>
                            <p className="text-3xl font-bold mt-2">{totalProducts}</p>
                        </div>
                        <i className="fas fa-box text-4xl text-green-200"></i>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total Pets</p>
                            <p className="text-3xl font-bold mt-2">{totalPets}</p>
                        </div>
                        <i className="fas fa-paw text-4xl text-purple-200"></i>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Total Services</p>
                            <p className="text-3xl font-bold mt-2">{totalServices}</p>
                        </div>
                        <i className="fas fa-hands-helping text-4xl text-orange-200"></i>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-clock text-yellow-500 mr-2"></i>
                        Pending Applications
                    </h3>
                    <p className="text-4xl font-bold text-yellow-600">{pendingApplications.length}</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-check-circle text-green-500 mr-2"></i>
                        Approved
                    </h3>
                    <p className="text-4xl font-bold text-green-600">{approvedApplications.length}</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-times-circle text-red-500 mr-2"></i>
                        Rejected
                    </h3>
                    <p className="text-4xl font-bold text-red-600">{rejectedApplications.length}</p>
                </div>
            </div>
        </div>
    );

    const renderApplicationsList = (applications, status) => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 capitalize">{status} Applications</h2>
            {applications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.filter(app => {
                        if (app.type === 'pet') return filters.pet;
                        if (app.type === 'product') return filters.product;
                        if (app.type === 'service') return filters.service;
                        return true;
                    }).map((app) => (
                        <div key={app._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                            <div className="relative">
                                {app.images && app.images.length > 0 ? (
                                    <img
                                        src={`data:${app.images[0].contentType};base64,${app.images[0].data}`}
                                        alt={app.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400">No image</span>
                                    </div>
                                )}
                                <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${
                                    app.type === 'pet' ? 'bg-purple-500 text-white' :
                                    app.type === 'product' ? 'bg-blue-500 text-white' :
                                    'bg-green-500 text-white'
                                }`}>
                                    {app.type}
                                </span>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">{app.name || app.title}</h3>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{app.description}</p>
                                <p className="text-lg font-bold text-indigo-600 mb-3">₹{app.price}</p>
                                <p className="text-xs text-gray-500 mb-3">
                                    Seller: {app.seller?.name || app.seller?.username || 'Unknown'}
                                </p>
                                {status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(app._id, app.type)}
                                            className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition text-sm"
                                        >
                                            <i className="fas fa-check mr-1"></i>
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(app._id, app.type)}
                                            className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition text-sm"
                                        >
                                            <i className="fas fa-times mr-1"></i>
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                    <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500 text-lg">No {status} applications</p>
                </div>
            )}
        </div>
    );

    const renderAllUsers = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">All Users</h2>
            {allUsers.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{user.name || user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'service_provider' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.joinedDate || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="text-indigo-600 hover:text-indigo-900 text-sm mr-3">
                                                <i className="fas fa-eye mr-1"></i>
                                                View
                                            </button>
                                            <button className="text-red-600 hover:text-red-900 text-sm">
                                                <i className="fas fa-ban mr-1"></i>
                                                Ban
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                    <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500 text-lg">No users found</p>
                </div>
            )}
        </div>
    );

    const renderOrders = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Orders</h2>
            {recentOrders.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">#{order.orderNumber || order._id.slice(-6)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{order.customer?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{order.total?.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                    <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500 text-lg">No orders found</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-lg min-h-screen p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Dashboard</h2>
                    <ul className="space-y-2 mb-6">
                        <li
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
                                activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-tachometer-alt"></i>
                            <span>Overview</span>
                        </li>
                        <li
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
                                activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-clock"></i>
                            <span>Pending</span>
                        </li>
                        <li
                            onClick={() => setActiveTab('approved')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
                                activeTab === 'approved' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-check-circle"></i>
                            <span>Approved</span>
                        </li>
                        <li
                            onClick={() => setActiveTab('rejected')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
                                activeTab === 'rejected' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-times-circle"></i>
                            <span>Rejected</span>
                        </li>
                    </ul>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">User Management</h2>
                    <ul className="space-y-2 mb-6">
                        <li
                            onClick={() => setActiveTab('all-users')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
                                activeTab === 'all-users' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-users"></i>
                            <span>All Users</span>
                        </li>
                    </ul>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">Content</h2>
                    <ul className="space-y-2 mb-6">
                        <li
                            onClick={() => setActiveTab('orders')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
                                activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-shopping-cart"></i>
                            <span>Orders</span>
                        </li>
                    </ul>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.pet}
                                onChange={(e) => setFilters({ ...filters, pet: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">Pets</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.product}
                                onChange={(e) => setFilters({ ...filters, product: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">Products</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.service}
                                onChange={(e) => setFilters({ ...filters, service: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">Services</span>
                        </label>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">
                        <i className="fas fa-shield-alt text-indigo-600 mr-3"></i>
                        Admin Dashboard
                    </h1>

                    {activeTab === 'dashboard' && renderDashboardOverview()}
                    {activeTab === 'pending' && renderApplicationsList(pendingApplications, 'pending')}
                    {activeTab === 'approved' && renderApplicationsList(approvedApplications, 'approved')}
                    {activeTab === 'rejected' && renderApplicationsList(rejectedApplications, 'rejected')}
                    {activeTab === 'all-users' && renderAllUsers()}
                    {activeTab === 'orders' && renderOrders()}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;