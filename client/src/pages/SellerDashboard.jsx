import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getSellerDashboard } from '../services/api';

const SellerDashboard = () => {
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
            const response = await getSellerDashboard();
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

    const handleEditProduct = (productId) => {
        navigate(`/seller/edit-product/${productId}`);
    };

    const handleEditPet = (petId) => {
        navigate(`/seller/edit-pet/${petId}`);
    };

    const handleToggleProductStatus = async (productId) => {
        // TODO: Implement toggle product status API
        console.log('Toggle product status:', productId);
    };

    const handleViewOrderDetails = (orderId) => {
        navigate(`/seller/orders/${orderId}`);
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

    const { user, seller, products = [], pets = [], sellerOrders = [], reviews = [], totalSales = 0, pendingOrders = 0, rating = 0 } = dashboardData;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Dashboard Header */}
                <header className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">
                            <span className="text-cyan-600">PetVerse</span>
                            <span className="text-teal-600 ml-2">Seller Dashboard</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium">Welcome, {user?.name || 'Seller'}</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-box text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{products.length}</div>
                                <div className="text-gray-600 text-sm">Total Products</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">₹{totalSales.toLocaleString()}</div>
                                <div className="text-gray-600 text-sm">Total Sales</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-clock text-yellow-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{pendingOrders}</div>
                                <div className="text-gray-600 text-sm">Pending Orders</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-star text-purple-600 text-xl"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{rating}/5</div>
                                <div className="text-gray-600 text-sm">Rating</div>
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
                                <i className="fas fa-envelope text-blue-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Email Address</div>
                                <div className="text-gray-800 font-medium">{user?.email || seller?.email || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-phone text-green-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                                <div className="text-gray-800 font-medium">{user?.phone || seller?.phone || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-building text-purple-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Business Name</div>
                                <div className="text-gray-800 font-medium">{seller?.businessName || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-map-marker-alt text-yellow-600"></i>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Business Address</div>
                                <div className="text-gray-800 font-medium">{seller?.businessAddress || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Product Management */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <i className="fas fa-box text-indigo-500 mr-3"></i>
                            Product Management
                        </h2>
                        <Link
                            to="/seller/add-product"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Add New Product
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.length > 0 ? products.map((product) => (
                            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                                <div className="relative">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={`data:${product.images[0].contentType};base64,${product.images[0].data}`}
                                            alt={product.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                    {product.discount > 0 && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                            {product.discount}% OFF
                                        </span>
                                    )}
                                    <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                                        product.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                    }`}>
                                        <i className="fas fa-circle text-xs mr-1"></i>
                                        {product.status || 'Active'}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xl font-bold text-gray-800">₹{product.price}</span>
                                        <span className={`text-sm ${product.stock < 5 ? 'text-red-600' : 'text-gray-600'}`}>
                                            {product.stock} units
                                        </span>
                                    </div>
                                    <h3 className="text-sm text-gray-700 mb-3 line-clamp-2">{product.name}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditProduct(product._id)}
                                            className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-md hover:bg-blue-200 transition text-sm"
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleProductStatus(product._id)}
                                            className="flex-1 bg-red-100 text-red-600 py-2 rounded-md hover:bg-red-200 transition text-sm"
                                        >
                                            <i className="fas fa-power-off mr-1"></i>
                                            Toggle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
                                <p className="text-gray-500 text-lg mb-4">No products found. Add your first product!</p>
                                <Link
                                    to="/seller/add-product"
                                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Add Product
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Pet Management */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <i className="fas fa-paw text-pink-500 mr-3"></i>
                            Pet Management
                        </h2>
                        <Link
                            to="/seller/add-pet"
                            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Add New Pet
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pets.length > 0 ? pets.map((pet) => (
                            <div key={pet._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                                <div className="relative">
                                    {pet.images && pet.images.length > 0 ? (
                                        <img
                                            src={`data:${pet.images[0].contentType};base64,${pet.images[0].data}`}
                                            alt={pet.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xl font-bold text-gray-800">₹{pet.price}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{pet.name}</h3>
                                    <p className="text-sm text-gray-600 mb-1">{pet.category}</p>
                                    <p className="text-sm text-gray-600 mb-3">{pet.breed}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditPet(pet._id)}
                                            className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-md hover:bg-blue-200 transition text-sm"
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <i className="fas fa-paw text-6xl text-gray-300 mb-4"></i>
                                <p className="text-gray-500 text-lg mb-4">No pets found. Add your first pet!</p>
                                <Link
                                    to="/seller/add-pet"
                                    className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
                                >
                                    Add Pet
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Orders */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-shopping-bag text-green-500 mr-3"></i>
                        Recent Orders
                    </h2>

                    {sellerOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sellerOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">#{order.orderNumber || order._id.slice(-6)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{order.customer?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        {item.product?.name} <span className="text-gray-500">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">₹{order.total?.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleViewOrderDetails(order._id)}
                                                    className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition text-sm"
                                                >
                                                    <i className="fas fa-eye mr-1"></i>
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500 text-lg">No orders received yet.</p>
                        </div>
                    )}
                </section>

                {/* Customer Reviews */}
                <section className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-star text-yellow-500 mr-3"></i>
                        Customer Reviews
                    </h2>

                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map((review) => (
                                <div key={review._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{review.product?.name}</h4>
                                            <p className="text-xs text-gray-500">
                                                <i className="far fa-calendar-alt mr-1"></i>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <i
                                                    key={i}
                                                    className={`fas fa-star text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                ></i>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                                    {review.reply ? (
                                        <div className="bg-white p-3 rounded border-l-4 border-indigo-500">
                                            <p className="text-xs text-gray-500 mb-1">
                                                <i className="fas fa-reply mr-1"></i>
                                                <strong>Your Reply:</strong>
                                            </p>
                                            <p className="text-sm text-gray-700">{review.reply}</p>
                                        </div>
                                    ) : (
                                        <button className="text-indigo-600 text-sm hover:text-indigo-700 font-medium">
                                            <i className="fas fa-reply mr-1"></i>
                                            Reply
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="fas fa-comment-slash text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500 text-lg">No reviews received yet.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default SellerDashboard;