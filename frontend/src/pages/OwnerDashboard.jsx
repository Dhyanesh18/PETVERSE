import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getOwnerDashboard, addToCart, removeFromCart } from '../services/api';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await getOwnerDashboard();
            setDashboardData(response.data);
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            await addToCart(productId, 1);
            alert('Product added to cart!');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add to cart');
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        if (!window.confirm('Remove from wishlist?')) return;
        
        try {
            // Call API to remove from wishlist
            await removeFromCart(productId);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
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

    if (!dashboardData || !user) {
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Dashboard Header */}
                <header className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">
                            <span className="text-indigo-600">PetVerse</span>
                            <span className="text-green-600 ml-2">Buyer Dashboard</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium">Welcome, {user.username}</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-shopping-bag text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{user.totalOrders || 0}</div>
                                <div className="text-gray-600 text-sm">Total Orders</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-clock text-yellow-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{user.activeOrders || 0}</div>
                                <div className="text-gray-600 text-sm">Active Orders</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">₹{(user.totalSpent || 0).toLocaleString('en-IN')}</div>
                                <div className="text-gray-600 text-sm">Total Spent</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-wallet text-purple-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">₹{user.walletAmount || 0}</div>
                                <div className="text-gray-600 text-sm">Wallet Balance</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wishlist Section */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <i className="fas fa-heart text-red-500 mr-3"></i>
                            My Wishlist
                        </h2>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {dashboardData.wishlistedProducts?.length > 0 && dashboardData.wishlistedProducts.map((product) => (
                            <div key={product._id} className="min-w-[250px] bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 hover:shadow-xl transition">
                                <Link to={`/buy/${product._id}`}>
                                    <div className="relative pt-[100%]">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={`data:${product.images[0].contentType};base64,${product.images[0].data}`}
                                                alt={product.name}
                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{product.brand || 'Unknown Brand'}</p>
                                    <div className="flex items-center gap-2 mb-3">
                                        {product.discount > 0 ? (
                                            <>
                                                <span className="text-gray-400 line-through text-sm">₹{product.price}</span>
                                                <span className="text-cyan-600 font-bold text-lg">₹{(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">{product.discount}% OFF</span>
                                            </>
                                        ) : (
                                            <span className="text-cyan-600 font-bold text-lg">₹{product.price}</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-green-600 mb-3">
                                        {product.stock === 0 ? (
                                            <span className="text-red-600">Out of Stock</span>
                                        ) : product.stock <= 5 ? (
                                            `Only ${product.stock} left!`
                                        ) : (
                                            'In Stock'
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(product._id)}
                                            disabled={product.stock === 0}
                                            className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-2 rounded-md hover:from-cyan-600 hover:to-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFromWishlist(product._id)}
                                            className="w-10 h-10 border border-gray-300 rounded-full text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                                        >
                                            <i className="fas fa-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {dashboardData.wishlistedPets?.length > 0 && dashboardData.wishlistedPets.map((pet) => (
                            <div key={pet._id} className="min-w-[250px] bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 hover:shadow-xl transition">
                                <Link to={`/seller/detail/${pet._id}`}>
                                    <div className="relative pt-[100%]">
                                        {pet.images && pet.images.length > 0 ? (
                                            <img
                                                src={`data:${pet.images[0].contentType};base64,${pet.images[0].data}`}
                                                alt={pet.name}
                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 mb-2 truncate">{pet.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{pet.breed || pet.category}</p>
                                    <p className="text-xs text-gray-500 mb-3">Age: {pet.age} | {pet.gender}</p>
                                    <div className="text-cyan-600 font-bold text-lg mb-3">₹{pet.price}</div>
                                    <div className="text-sm text-green-600 mb-3">
                                        {pet.available ? 'Available' : 'Not Available'}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/seller/detail/${pet._id}`}
                                            className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-2 rounded-md hover:from-cyan-600 hover:to-teal-600 transition text-sm font-medium text-center"
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveFromWishlist(pet._id)}
                                            className="w-10 h-10 border border-gray-300 rounded-full text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                                        >
                                            <i className="fas fa-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!dashboardData.wishlistedProducts || dashboardData.wishlistedProducts.length === 0) &&
                         (!dashboardData.wishlistedPets || dashboardData.wishlistedPets.length === 0) && (
                            <div className="w-full text-center py-12">
                                <i className="fas fa-heart-broken text-6xl text-gray-300 mb-4"></i>
                                <p className="text-gray-500 text-lg mb-4">No items in your wishlist yet.</p>
                                <Link to="/products" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                                    Browse Products
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Registered Events Section */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <i className="fas fa-ticket-alt text-purple-500 mr-3"></i>
                            Registered Events
                        </h2>
                    </div>

                    {dashboardData.registeredEvents && dashboardData.registeredEvents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dashboardData.registeredEvents.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {event.title} <span className="text-gray-500 text-sm ml-2">({event.category})</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(event.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{event.startTime} - {event.endTime}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{event.city}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    to={`/events/${event.id}/ticket`}
                                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm"
                                                >
                                                    View Ticket
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="fas fa-ticket-alt text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500 text-lg mb-4">No event registrations yet. Explore and join an event!</p>
                            <Link to="/events" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                                <i className="fas fa-calendar mr-2"></i>
                                Browse Events
                            </Link>
                        </div>
                    )}
                </section>

                {/* Profile Information Section */}
                <section className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <i className="fas fa-user-circle text-blue-500 mr-3"></i>
                            Profile Information
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-envelope text-blue-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Email Address</div>
                                <div className="text-gray-800 font-medium">{user.email}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-phone text-green-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                                <div className="text-gray-800 font-medium">{user.phone}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-map-marker-alt text-purple-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Address</div>
                                <div className="text-gray-800 font-medium">{user.address}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-calendar text-yellow-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Member Since</div>
                                <div className="text-gray-800 font-medium">{user.joinedDate || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default OwnerDashboard;