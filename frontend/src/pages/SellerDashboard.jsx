import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { setSellerProducts } from '../redux/slices/productSlice';
import { setSellerPets } from '../redux/slices/petSlice';
import { fetchSellerDashboard, updateOrderStatus, updateSellerProfile } from '../redux/slices/sellerSlice';
import EditProfileModal from '../components/EditProfileModal';
import SellerChatModal from '../components/SellerChatModal';
import SellerAnalytics from '../components/seller/SellerAnalytics';
import Pagination from '../components/Pagination';
import './SellerDashboard.css';

const SellerDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, logout, loading: authLoading, setUser, refreshSession } = useAuth();
    const fetchInitialized = useRef(false);
    
    // Redux state for products and pets
    const { sellerProducts: products, loading: productsLoading } = useSelector((state) => state.product);
    const { sellerPets: pets, loading: petsLoading } = useSelector((state) => state.pet);
    
    // Redux state for seller dashboard
    const { 
        seller, 
        statistics, 
        orders, 
        reviews, 
        loading: sellerLoading 
    } = useSelector((state) => state.seller);
    
    // Local state
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [chats, setChats] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    
    // Pagination states
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const [currentPetPage, setCurrentPetPage] = useState(1);
    const [currentOrderPage, setCurrentOrderPage] = useState(1);
    const [currentReviewPage, setCurrentReviewPage] = useState(1);
    const [currentChatPage, setCurrentChatPage] = useState(1);
    const itemsPerPage = 12;
    
    // Combine loading states
    const loading = sellerLoading || productsLoading || petsLoading;

    const fetchSellerData = useCallback(async () => {
        if (!user) {
            console.log('No user found, redirecting to login');
            navigate('/login');
            return;
        }

        if (user.role !== 'seller') {
            console.log('User is not a seller:', user.role);
            navigate('/login');
            return;
        }

        try {
            console.log('Fetching seller dashboard...');
            
            const result = await dispatch(fetchSellerDashboard()).unwrap();
            console.log('Seller dashboard result:', result);
            
            dispatch(setSellerProducts(result.products || []));
            dispatch(setSellerPets(result.pets || []));

            fetchSellerChats();
            fetchSellerInquiries();
        } catch (error) {
            console.error('Error fetching seller data:', error);

            if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
                console.log('Unauthorized - redirecting to login');
                navigate('/login');
                return;
            }
            if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
                console.log('Forbidden - user may not have seller role, redirecting to login');
                navigate('/login');
                return;
            }
        }
    }, [navigate, user, dispatch]);

    const fetchSellerChats = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/api/seller/chats`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setChats(data.data.chats || []);
                console.log('Seller chats loaded:', data.data);
            }
        } catch (error) {
            console.error('Error fetching seller chats:', error);
        }
    };

    const fetchSellerInquiries = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/api/seller/inquiries`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setInquiries(data.data.inquiries || []);
                console.log('Seller inquiries loaded:', data.data);
            }
        } catch (error) {
            console.error('Error fetching seller inquiries:', error);
        }
    };

    const handleOpenChat = (chat) => {
        setSelectedChat(chat);
        setIsChatModalOpen(true);
        
        // Update local state to mark as read immediately
        if (chat.isPetInquiry) {
            setInquiries(prevInquiries => 
                prevInquiries.map(inquiry => 
                    inquiry._id === chat._id 
                        ? { ...inquiry, unreadCount: 0 }
                        : inquiry
                )
            );
        } else {
            setChats(prevChats => 
                prevChats.map(c => 
                    c._id === chat._id 
                        ? { ...c, unreadCount: 0 }
                        : c
                )
            );
        }
    };

    const handleCloseChat = () => {
        setIsChatModalOpen(false);
        setSelectedChat(null);
        fetchSellerChats();
        fetchSellerInquiries();
    };

    const handleDeleteChat = async (chatId, e) => {
        e.stopPropagation();
        
        if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/api/seller/chats/${chatId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setChats(prevChats => prevChats.filter(c => c._id !== chatId));
                console.log('Chat deleted successfully');
            } else {
                alert('Failed to delete chat: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Failed to delete chat');
        }
    };

    useEffect(() => {
        if (fetchInitialized.current) return;
        fetchInitialized.current = true;
        
        fetchSellerData();
    }, [fetchSellerData]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const toggleProductStatus = async (productId) => {
        try {
            const response = await fetch(`/api/seller/products/${productId}/toggle-status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchSellerData();
            }
        } catch (error) {
            console.error('Error toggling product status:', error);
        }
    };

    const togglePetStatus = async (petId) => {
        try {
            const response = await fetch(`/api/seller/pets/${petId}/toggle-status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchSellerData();
            }
        } catch (error) {
            console.error('Error toggling pet status:', error);
        }
    };

    const updateOrderStatusHandler = async (orderId, newStatus) => {
        try {
            const statusSelect = document.querySelector(`select[data-order-id="${orderId}"]`);
            if (statusSelect) {
                statusSelect.disabled = true;
                statusSelect.classList.add('loading');
            }

            await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
            alert(`Order status updated to ${newStatus.toUpperCase()} successfully!`);
            await dispatch(fetchSellerDashboard()).unwrap();
        } catch (error) {
            console.error('Error updating order status:', error);
            const errorMessage = error?.message || 'Failed to update order status';
            alert(`Failed to update order status: ${errorMessage}`);
            await dispatch(fetchSellerDashboard()).unwrap();
        } finally {
            const statusSelect = document.querySelector(`select[data-order-id="${orderId}"]`);
            if (statusSelect) {
                statusSelect.disabled = false;
                statusSelect.classList.remove('loading');
            }
        }
    };

    const editProduct = (productId) => {
        navigate(`/seller/products/edit/${productId}`);
    };

    const editPet = (petId) => {
        navigate(`/seller/pets/edit/${petId}`);
    };

    const viewOrderDetails = (orderId) => {
        navigate(`/seller/order-details/${orderId}`);
    };

    const handleReplyToReview = (reviewId) => {
        const reply = prompt('Enter your reply to this review:');
        if (reply && reply.trim()) {
            console.log('Reply to review:', reviewId, reply);
            alert('Reply functionality will be implemented soon!');
        }
    };

    const addNewProduct = () => {
        navigate('/seller/products/add');
    };

    const addNewPet = () => {
        navigate('/seller/pets/add');
    };

    const handleSaveProfile = async (formData) => {
        try {
            console.log('Saving profile with data:', formData);
            
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Profile update response:', data);

            if (response.ok && data.success) {
                console.log('Updated user data:', data.data.user);
                
                setUser(data.data.user);
                
                dispatch(updateSellerProfile({
                    fullName: data.data.user.fullName,
                    email: data.data.user.email,
                    phone: data.data.user.phone,
                    businessName: data.data.user.businessName,
                    businessAddress: data.data.user.businessAddress
                }));
                
                console.log('User and seller state updated');
                
                alert('Profile updated successfully!');
                
                await refreshSession();
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    if (loading || authLoading) {
        return (
            <div className="seller-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    // Dashboard Overview Component
    const renderDashboardOverview = () => {
        // Calculate total unread messages from both chats and inquiries
        const unreadChatsCount = chats.filter(c => c.unreadCount > 0).length;
        const unreadInquiriesCount = inquiries.filter(i => i.unreadCount > 0).length;
        const totalUnreadMessages = unreadChatsCount + unreadInquiriesCount;

        return (
        <>
            {/* Stats Grid */}
            <div className="dashboard-stats-overview">
                <div className="stat-card-overview" onClick={() => setActiveTab('chats')}>
                    <div className="stat-icon-wrapper chats">
                        <i className="fas fa-comments"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{totalUnreadMessages}</div>
                        <div className="stat-label">Unread Chats</div>
                    </div>
                </div>
                <div className="stat-card-overview" onClick={() => setActiveTab('analytics')}>
                    <div className="stat-icon-wrapper sales">
                        <i className="fas fa-rupee-sign"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">₹{statistics.totalRevenue.toLocaleString()}</div>
                        <div className="stat-label">Total Sales</div>
                    </div>
                </div>
                <div className="stat-card-overview" onClick={() => setActiveTab('orders')}>
                    <div className="stat-icon-wrapper pending">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.pendingOrders}</div>
                        <div className="stat-label">Active Orders</div>
                        <div className="stat-sublabel" style={{fontSize: '0.7rem', color: '#888'}}>Pending/Processing/Shipped</div>
                    </div>
                </div>
                <div className="stat-card-overview" onClick={() => navigate('/wallet')}>
                    <div className="stat-icon-wrapper wallet">
                        <i className="fas fa-wallet"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">₹{statistics.walletBalance.toFixed(2)}</div>
                        <div className="stat-label">Wallet Balance</div>
                    </div>
                </div>
            </div>

            {/* Profile Information Section */}
            <div className="content-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-user-circle"></i>
                        Profile Information
                    </h2>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn-primary-action"
                    >
                        <i className="fas fa-edit"></i> Edit Profile
                    </button>
                </div>
                <div className="profile-grid">
                    <div className="profile-info">
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Email Address</div>
                                <div className="info-value">
                                    {user?.email || seller?.email || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-phone"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Phone Number</div>
                                <div className="info-value">
                                    {user?.phone || seller?.phone || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-building"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Business Name</div>
                                <div className="info-value">
                                    {user?.businessName || seller?.businessName || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="profile-info">
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Business Address</div>
                                <div className="info-value">
                                    {user?.businessAddress || seller?.businessAddress || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Average Rating</div>
                                <div className="info-value">
                                    {statistics.averageRating.toFixed(1)}/5
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-box"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Total Products</div>
                                <div className="info-value">
                                    {statistics.totalProducts}
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-paw"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Total Pets</div>
                                <div className="info-value">
                                    {statistics.totalPets}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
        );
    };

    // Product Management Component
    const renderProductManagement = () => {
        const totalPages = Math.ceil((products?.length || 0) / itemsPerPage);
        const startIndex = (currentProductPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = products?.slice(startIndex, endIndex) || [];

        return (
            <div className="content-section">
            <div className="section-header">
                <h2><i className="fas fa-box"></i> Product Management</h2>
                <button onClick={addNewProduct} className="btn-primary-action">
                    <i className="fas fa-plus"></i> Add Product
                </button>
            </div>

            <div className="products-grid">
                {paginatedProducts && paginatedProducts.length > 0 ? (
                    paginatedProducts.map(product => (
                        <div key={product._id} className="product-card">
                            <div className="product-image-container">
                                <img
                                    src={`/api/images/product/${product._id}/0`}
                                    alt={product.name}
                                    className="product-image"
                                    onError={(e) => {
                                        if (!e.target.dataset.fallbackAttempted) {
                                            e.target.dataset.fallbackAttempted = 'true';
                                            const category = product.category?.toLowerCase() || '';
                                            const name = product.name?.toLowerCase() || '';

                                            if (category.includes('food') || name.includes('food')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300';
                                            } else if (category.includes('toy') || name.includes('toy')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300';
                                            } else {
                                                e.target.src = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300';
                                            }
                                        }
                                    }}
                                />
                                {product.discount && product.discount !== '0%' && (
                                    <span className="discount-tag">{product.discount} OFF</span>
                                )}
                                <span className={`status-indicator ${product.available ? 'active' : 'inactive'}`}>
                                    <i className="fas fa-circle"></i> {product.available ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="product-info">
                                <div className="product-details">
                                    <div className="price-stock">
                                        <span className="price">₹{product.price}</span>
                                        <span className={`stock ${product.stock < 5 ? 'low-stock' : ''}`}>
                                            {product.stock} units
                                        </span>
                                    </div>
                                    <div className="product-title">{product.name}</div>
                                </div>
                                <div className="product-actions">
                                    <button
                                        className="btn btn-icon btn-edit"
                                        onClick={() => editProduct(product._id)}
                                        title="Edit Product"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        className="btn btn-icon btn-deactivate"
                                        onClick={() => toggleProductStatus(product._id)}
                                        title={product.available ? 'Deactivate' : 'Activate'}
                                    >
                                        <i className="fas fa-power-off"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-box-open"></i>
                        <p>No products found. Add your first product!</p>
                    </div>
                )}
            </div>
            {products && products.length > 0 && (
                <Pagination
                    currentPage={currentProductPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentProductPage}
                />
            )}
        </div>
    );
};

    // Pet Management Component
    const renderPetManagement = () => {
        const totalPages = Math.ceil((pets?.length || 0) / itemsPerPage);
        const startIndex = (currentPetPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedPets = pets?.slice(startIndex, endIndex) || [];

        return (
            <div className="content-section">
            <div className="section-header">
                <h2><i className="fas fa-paw"></i> Pet Management</h2>
                <button onClick={addNewPet} className="btn-primary-action">
                    <i className="fas fa-plus"></i> Add Pet
                </button>
            </div>

            <div className="products-grid">
                {paginatedPets && paginatedPets.length > 0 ? (
                    paginatedPets.map(pet => (
                        <div key={pet._id} className="product-card">
                            <div className="product-image-container">
                                <img
                                    src={`/api/images/pet/${pet._id}/0`}
                                    alt={pet.name}
                                    className="product-image"
                                    onError={(e) => {
                                        if (!e.target.dataset.fallbackAttempted) {
                                            e.target.dataset.fallbackAttempted = 'true';
                                            const category = pet.category?.toLowerCase() || '';
                                            const breed = pet.breed?.toLowerCase() || '';

                                            if (category.includes('dog') || breed.includes('dog')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300';
                                            } else if (category.includes('cat') || breed.includes('cat')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300';
                                            } else {
                                                e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300';
                                            }
                                        }
                                    }}
                                />
                                <span className={`status-indicator ${pet.isActive !== false ? 'active' : 'inactive'}`}>
                                    <i className="fas fa-circle"></i> {pet.isActive !== false ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                            <div className="product-info">
                                <div className="product-details">
                                    <div className="price-stock">
                                        <span className="price">₹{pet.price}</span>
                                        <span className="stock">{pet.category} • {pet.breed}</span>
                                    </div>
                                    <div className="product-title">{pet.name}</div>
                                </div>
                                <div className="product-actions">
                                    <button
                                        className="btn btn-icon btn-edit"
                                        onClick={() => editPet(pet._id)}
                                        title="Edit Pet"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        className="btn btn-icon btn-deactivate"
                                        onClick={() => togglePetStatus(pet._id)}
                                        title={pet.available !== false ? 'Mark Unavailable' : 'Mark Available'}
                                    >
                                        <i className="fas fa-power-off"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-paw"></i>
                        <p>No pets found. Add your first pet!</p>
                    </div>
                )}
            </div>
            {pets && pets.length > 0 && (
                <Pagination
                    currentPage={currentPetPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPetPage}
                />
            )}
        </div>
    );
};

    // Orders Management Component
    const renderOrdersManagement = () => {
        const totalPages = Math.ceil((orders?.length || 0) / itemsPerPage);
        const startIndex = (currentOrderPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedOrders = orders?.slice(startIndex, endIndex) || [];

        return (
            <div className="content-section">
            <div className="section-header">
                <h2><i className="fas fa-shopping-bag"></i> Orders Management</h2>
                <div className="orders-stats">
                    <span className="stat-badge pending">
                        <i className="fas fa-clock"></i>
                        {statistics.pendingOrders} Active
                    </span>
                    <span style={{fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem'}}>
                        (Pending/Processing/Shipped)
                    </span>
                </div>
            </div>

            {paginatedOrders && paginatedOrders.length > 0 ? (
                <div className="orders-container">
                    <div className="table-responsive">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Products</th>
                                    <th>Total</th>
                                    <th>Status & Actions</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map(order => (
                                    <tr key={order._id} className="order-row">
                                        <td className="order-id">#{order.orderNumber || order._id?.slice(-6)}</td>
                                        <td className="customer-name">{order.customer?.name || 'Unknown'}</td>
                                        <td className="order-products">
                                            {order.items?.map((item, index) => (
                                                <div key={index} className="product-item">
                                                    <span className="product-name">
                                                        {item.product?.name || `${item.itemType || 'Product'}`}
                                                    </span>
                                                    <span className="product-quantity">×{item.quantity}</span>
                                                </div>
                                            ))}
                                        </td>
                                        <td className="order-total">
                                            <span className="amount">₹{order.totalAmount?.toLocaleString()}</span>
                                        </td>
                                        <td className="order-status-actions">
                                            <div className="status-actions-container">
                                                <select
                                                    className={`status-select ${order.status?.toLowerCase()}`}
                                                    value={order.status || 'pending'}
                                                    data-order-id={order._id}
                                                    onChange={(e) => updateOrderStatusHandler(order._id, e.target.value)}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <button
                                                    className="btn btn-primary btn-sm view-details-btn"
                                                    onClick={() => viewOrderDetails(order._id)}
                                                    title="View Details"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="order-date">
                                            {order.createdAt || order.orderDate ?
                                                new Date(order.createdAt || order.orderDate).toLocaleDateString() :
                                                'N/A'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <i className="fas fa-shopping-cart"></i>
                    <p>No orders received yet.</p>
                </div>
            )}
            {orders && orders.length > 0 && (
                <Pagination
                    currentPage={currentOrderPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentOrderPage}
                />
            )}
        </div>
    );
};

    // Customer Chats Component
    const renderCustomerChats = () => {
        // Combine chats and inquiries
        const allMessages = [
            ...chats.map(chat => ({ ...chat, type: 'order', isPetInquiry: false })),
            ...inquiries.map(inquiry => ({ ...inquiry, type: 'inquiry', isPetInquiry: true }))
        ].sort((a, b) => {
            const dateA = new Date(a.lastMessage?.timestamp || a.lastMessage || a.updatedAt);
            const dateB = new Date(b.lastMessage?.timestamp || b.lastMessage || b.updatedAt);
            return dateB - dateA;
        });

        const unreadMessages = allMessages.filter(m => m.unreadCount > 0);
        const totalPages = Math.ceil(unreadMessages.length / itemsPerPage);
        const startIndex = (currentChatPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedMessages = unreadMessages.slice(startIndex, endIndex);

        return (
            <div className="content-section">
            <div className="section-header">
                <h2><i className="fas fa-comments"></i> Customer Messages</h2>
                <div className="orders-stats">
                    <span className="stat-badge pending">
                        <i className="fas fa-envelope"></i>
                        {unreadMessages.length} Unread
                    </span>
                </div>
            </div>

            {paginatedMessages && paginatedMessages.length > 0 ? (
                <div className="chats-list">
                    {paginatedMessages.map((message) => (
                        <div 
                            key={message._id} 
                            className={`chat-item ${message.unreadCount > 0 ? 'unread' : ''}`}
                            onClick={() => handleOpenChat(message)}
                        >
                            <div className="chat-item-header">
                                <div className="customer-info">
                                    <i className="fas fa-user-circle"></i>
                                    <div className="customer-details">
                                        <h4>{message.customer?.name || message.customer?.fullName || message.customer?.username || 'Customer'}</h4>
                                        <span className="order-reference">
                                            {message.isPetInquiry ? (
                                                <>
                                                    <i className="fas fa-paw"></i> About: {message.petId?.name || 'Pet'}
                                                </>
                                            ) : (
                                                <>Order #{message.orderId?.orderNumber || message.orderId?._id?.slice(-6)}</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="chat-item-meta">
                                    {message.unreadCount > 0 && (
                                        <span className="unread-badge">{message.unreadCount}</span>
                                    )}
                                    <span className="chat-time">
                                        {new Date(message.lastMessage?.timestamp || message.lastMessage || message.updatedAt).toLocaleDateString()}
                                    </span>
                                    {!message.isPetInquiry && (
                                        <button 
                                            className="chat-delete-btn"
                                            onClick={(e) => handleDeleteChat(message._id, e)}
                                            title="Delete chat"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="chat-item-preview">
                                <p>{message.lastMessage?.content || 'No messages yet'}</p>
                            </div>
                            <div className="chat-item-footer">
                                {message.isPetInquiry ? (
                                    <>
                                        <span className="inquiry-badge">
                                            <i className="fas fa-question-circle"></i> Pet Inquiry
                                        </span>
                                        {message.petId?.price && (
                                            <span className="order-amount">
                                                ₹{message.petId.price.toLocaleString()}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="order-amount">
                                        ₹{message.orderId?.totalAmount?.toLocaleString()}
                                    </span>
                                )}
                                <button className="chat-open-btn">
                                    <i className="fas fa-comments"></i> Open Chat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <i className="fas fa-comment-slash"></i>
                    <p>{allMessages.length > 0 ? 'All messages have been read!' : 'No customer messages yet.'}</p>
                </div>
            )}
            {unreadMessages.length > 0 && (
                <Pagination
                    currentPage={currentChatPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentChatPage}
                />
            )}
        </div>
    );
};

    // Customer Reviews Component
    const renderCustomerReviews = () => {
        const totalPages = Math.ceil((reviews?.length || 0) / itemsPerPage);
        const startIndex = (currentReviewPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedReviews = reviews?.slice(startIndex, endIndex) || [];

        return (
            <div className="content-section">
            <div className="section-header">
                <h2><i className="fas fa-star"></i> Customer Reviews</h2>
            </div>

            {paginatedReviews && paginatedReviews.length > 0 ? (
                <div className="reviews-grid">
                    {paginatedReviews.map(review => (
                        <div key={review._id} className="review-card">
                            <div className="review-header">
                                <div className="product-info">
                                    <h4>{review.productName}</h4>
                                    <div className="review-date">
                                        <i className="far fa-calendar-alt"></i>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="review-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <i
                                            key={i}
                                            className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}
                                        ></i>
                                    ))}
                                </div>
                            </div>

                            <div className="review-content">
                                <div className="customer-info">
                                    <i className="fas fa-user-circle"></i>
                                    <span>{review.user?.name || 'Customer'}</span>
                                </div>
                                <p>{review.comment}</p>
                            </div>

                            {review.reply ? (
                                <div className="review-reply">
                                    <i className="fas fa-reply"></i>
                                    <strong>Your Reply:</strong>
                                    <p>{review.reply}</p>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-secondary btn-sm reply-btn"
                                    onClick={() => handleReplyToReview(review._id)}
                                >
                                    <i className="fas fa-reply"></i> Reply
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <i className="fas fa-comment-slash"></i>
                    <p>No reviews received yet.</p>
                </div>
            )}
            {reviews && reviews.length > 0 && (
                <Pagination
                    currentPage={currentReviewPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentReviewPage}
                />
            )}
        </div>
    );
};

    return (
        <div className="seller-dashboard-container">
            <div className="seller-main-container">
                {/* Sidebar */}
                <aside className="seller-sidebar">
                    <div className="sidebar-section">
                        <h2>Dashboard</h2>
                        <ul className="seller-menu">
                            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabChange('dashboard')}>
                                <i className="fas fa-tachometer-alt"></i> Dashboard Overview
                            </li>
                            <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => handleTabChange('analytics')}>
                                <i className="fas fa-chart-line"></i> Analytics
                            </li>
                            <li className={activeTab === 'chats' ? 'active' : ''} onClick={() => handleTabChange('chats')}>
                                <i className="fas fa-comments"></i> Customer Messages
                                {(() => {
                                    const totalUnread = chats.filter(c => c.unreadCount > 0).length + inquiries.filter(i => i.unreadCount > 0).length;
                                    return totalUnread > 0 && (
                                        <span className="notification-badge">{totalUnread}</span>
                                    );
                                })()}
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Inventory Management</h2>
                        <ul className="seller-menu">
                            <li className={activeTab === 'products' ? 'active' : ''} onClick={() => handleTabChange('products')}>
                                <i className="fas fa-box"></i> Products
                            </li>
                            <li className={activeTab === 'pets' ? 'active' : ''} onClick={() => handleTabChange('pets')}>
                                <i className="fas fa-paw"></i> Pets
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Sales & Orders</h2>
                        <ul className="seller-menu">
                            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => handleTabChange('orders')}>
                                <i className="fas fa-shopping-bag"></i> Orders
                                {statistics.pendingOrders > 0 && (
                                    <span className="notification-badge">{statistics.pendingOrders}</span>
                                )}
                            </li>
                            <li className={activeTab === 'reviews' ? 'active' : ''} onClick={() => handleTabChange('reviews')}>
                                <i className="fas fa-star"></i> Reviews
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Financial</h2>
                        <ul className="seller-menu">
                            <li onClick={() => navigate('/wallet')}>
                                <i className="fas fa-wallet"></i> Wallet
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <ul className="seller-menu">
                            <li onClick={handleLogout} className="logout-btn">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="seller-content">
                    <header className="seller-header">
                        <h1>PetVerse Seller Dashboard</h1>
                        <div className="seller-user-info">
                            <span>Welcome, {user?.fullName || user?.name || 'Seller One'}!</span>
                        </div>
                    </header>

                    <div className="seller-content-wrapper">
                        {activeTab === 'dashboard' && renderDashboardOverview()}
                        {activeTab === 'analytics' && <SellerAnalytics />}
                        {activeTab === 'products' && renderProductManagement()}
                        {activeTab === 'pets' && renderPetManagement()}
                        {activeTab === 'orders' && renderOrdersManagement()}
                        {activeTab === 'chats' && renderCustomerChats()}
                        {activeTab === 'reviews' && renderCustomerReviews()}
                    </div>
                </main>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={{ ...user, ...seller }}
                onSave={handleSaveProfile}
            />

            {/* Seller Chat Modal */}
            {selectedChat && (
                <SellerChatModal
                    isOpen={isChatModalOpen}
                    onClose={handleCloseChat}
                    chat={selectedChat}
                    seller={user}
                />
            )}
        </div>
    );
};

export default SellerDashboard;
