import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { setSellerProducts } from '../redux/slices/productSlice';
import { setSellerPets } from '../redux/slices/petSlice';
import { fetchSellerDashboard, updateOrderStatus, clearSellerData } from '../redux/slices/sellerSlice';
import EditProfileModal from '../components/EditProfileModal';
import './SellerDashboard.css';

const SellerDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, logout, loading: authLoading } = useAuth();
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Combine loading states
    const loading = sellerLoading || productsLoading || petsLoading;

    const fetchSellerData = useCallback(async () => {
        // Check if user is authenticated first
        if (!user) {
            console.log('No user found, redirecting to login');
            navigate('/login');
            return;
        }

        // Check if user has seller role
        if (user.role !== 'seller') {
            console.log('User is not a seller:', user.role);
            navigate('/login');
            return;
        }

        try {
            console.log('Fetching seller dashboard...');
            
            // Fetch dashboard data using Redux thunk
            const result = await dispatch(fetchSellerDashboard()).unwrap();
            console.log('Seller dashboard result:', result);
            
            // Populate Redux state with products and pets from dashboard
            dispatch(setSellerProducts(result.products || []));
            dispatch(setSellerPets(result.pets || []));

            console.log('Reviews data:', result.reviews);
            console.log('Orders data:', result.recentOrders);
            console.log('Products data:', result.products);
            console.log('Pets data:', result.pets);
        } catch (error) {
            console.error('Error fetching seller data:', error);
            console.error('Error details:', error);

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

    // Fetch seller data on component mount
    useEffect(() => {
        // Prevent duplicate fetches in React StrictMode
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

    // Navigation handlers for stats cards
    const handleStatsCardClick = (cardType) => {
        switch (cardType) {
            case 'totalProducts': {
                // Scroll to Product Management section
                const productSection = document.getElementById('product-management') ||
                    document.querySelector('[class*="product"]') ||
                    document.querySelector('.dashboard-section');
                if (productSection) {
                    productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Highlight the section briefly
                    productSection.style.backgroundColor = '#f0fdf4';
                    setTimeout(() => {
                        productSection.style.backgroundColor = '';
                    }, 2000);
                }
                break;
            }
            case 'totalSales': {
                // Scroll to Orders section
                const ordersSection = document.getElementById('orders-section') ||
                    document.querySelector('[class*="order"]');
                if (ordersSection) {
                    ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    ordersSection.style.backgroundColor = '#f0fdf4';
                    setTimeout(() => {
                        ordersSection.style.backgroundColor = '';
                    }, 2000);
                }
                break;
            }
            case 'pendingOrders': {
                // Scroll to Orders section
                const ordersSection = document.getElementById('orders-section') ||
                    document.querySelector('[class*="order"]');
                if (ordersSection) {
                    ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    ordersSection.style.backgroundColor = '#fef3c7';
                    setTimeout(() => {
                        ordersSection.style.backgroundColor = '';
                    }, 2000);
                }
                break;
            }
            case 'wallet': {
                // Navigate to wallet page
                navigate('/wallet');
                break;
            }
            default:
                break;
        }
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
                fetchSellerData(); // Refresh data
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
                fetchSellerData(); // Refresh data
            }
        } catch (error) {
            console.error('Error toggling pet status:', error);
        }
    };

    const updateOrderStatusHandler = async (orderId, newStatus) => {
        try {
            // Show loading state
            const statusSelect = document.querySelector(`select[data-order-id="${orderId}"]`);
            if (statusSelect) {
                statusSelect.disabled = true;
                statusSelect.classList.add('loading');
            }

            // Use Redux thunk to update order status
            await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();

            // Show success message
            alert(`Order status updated to ${newStatus.toUpperCase()} successfully!`);

            // Optionally refresh data to sync with backend
            await dispatch(fetchSellerDashboard()).unwrap();
        } catch (error) {
            console.error('Error updating order status:', error);
            const errorMessage = error?.message || 'Failed to update order status';
            alert(`Failed to update order status: ${errorMessage}`);

            // Refresh data to reset to correct status
            await dispatch(fetchSellerDashboard()).unwrap();
        } finally {
            // Reset loading state
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
        // Navigate to order details page or show modal
        navigate(`/seller/order-details/${orderId}`);
    };

    const handleReplyToReview = (reviewId) => {
        // For now, just show an alert. Later this can open a modal
        const reply = prompt('Enter your reply to this review:');
        if (reply && reply.trim()) {
            // TODO: Implement API call to submit reply
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
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Profile updated successfully!');
                // Refresh seller data
                fetchSellerData();
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
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="seller-dashboard">
            {/* Dashboard Header */}
            <header className="dashboard-header" style={{ marginTop: "55px" }}>
                <h1 className="header-title">
                    <span className="petverse">PetVerse</span>
                    <span className="dashboard-text">Seller Dashboard</span>
                </h1>
                <div className="user-info">
                    <span className="user-name">Welcome, {user?.fullName || user?.name || 'Seller'}</span>
                    <button onClick={handleLogout} className="nav-btn logout-btn">
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-container">
                {/* Stats Grid */}
                <div className="dashboard-stats">
                    <div
                        className="stat-card clickable-stat-card"
                        onClick={() => handleStatsCardClick('totalProducts')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('totalProducts')}
                    >
                        <div className="stat-icon">
                            <i className="fas fa-box"></i>
                        </div>
                        <div className="stat-value">{statistics.totalProducts + statistics.totalPets}</div>
                        <div className="stat-label">Total Items</div>
                    </div>
                    <div
                        className="stat-card clickable-stat-card"
                        onClick={() => handleStatsCardClick('totalSales')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('totalSales')}
                    >
                        <div className="stat-icon">
                            <i className="fas fa-rupee-sign"></i>
                        </div>
                        <div className="stat-value">₹{statistics.totalRevenue.toLocaleString()}</div>
                        <div className="stat-label">Total Sales</div>
                    </div>
                    <div
                        className="stat-card clickable-stat-card"
                        onClick={() => handleStatsCardClick('pendingOrders')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('pendingOrders')}
                    >
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-value">{statistics.pendingOrders}</div>
                        <div className="stat-label">Pending Orders</div>
                    </div>
                    <div
                        className="stat-card clickable-stat-card"
                        onClick={() => handleStatsCardClick('wallet')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('wallet')}
                    >
                        <div className="stat-icon">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="stat-value">₹{statistics.walletBalance.toFixed(2)}</div>
                        <div className="stat-label">Wallet Balance</div>
                    </div>
                </div>

                <div className="dashboard-content" style={{ width: '100%', overflow: 'visible' }}>
                    {/* Profile Information Section */}
                    <div className="content-section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <i className="fas fa-user-circle"></i>
                                Profile Information
                            </h2>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="btn btn-primary"
                                style={{
                                    maxWidth: '200px',
                                    minWidth: '100px',
                                    height: '36px',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.875rem'
                                }}
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
                                            {seller?.businessName || 'N/A'}
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
                                            {seller?.businessAddress || 'N/A'}
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

                    {/* Product Management */}
                    <div id="product-management" className="content-section">
                        <div className="section-header">
                            <h2><i className="fas fa-box"></i> Product Management</h2>
                            <button
                                onClick={addNewProduct}
                                className="btn btn-primary"
                                style={{
                                    maxWidth: '200px',
                                    minWidth: '120px',
                                    height: '36px',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                <i className="fas fa-plus"></i> Add Product
                            </button>
                        </div>

                        <div className="products-grid">
                            {products && products.length > 0 ? (
                                products.map(product => (
                                    <div key={product._id} className="product-card">
                                        <div className="product-image-container">
                                            <img
                                                src={`/api/images/product/${product._id}/0`}
                                                alt={product.name}
                                                className="product-image"
                                                onError={(e) => {
                                                    console.log(`Product image failed to load: ${e.target.src}`);
                                                    if (!e.target.dataset.fallbackAttempted) {
                                                        e.target.dataset.fallbackAttempted = 'true';
                                                        // Try alternative API endpoints
                                                        if (e.target.src.includes('localhost:8080')) {
                                                            e.target.src = `/api/images/product/${product._id}/0`;
                                                            return;
                                                        } else if (e.target.src.includes('/api/images/')) {
                                                            // If API also fails, show fallback
                                                            console.log('Image API failed, showing category-specific fallback');
                                                        }
                                                        // Category-specific fallback images
                                                        const category = product.category?.toLowerCase() || '';
                                                        const name = product.name?.toLowerCase() || '';

                                                        if (category.includes('food') || name.includes('food') || name.includes('drool')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('toy') || name.includes('toy') || name.includes('kong')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('health') || name.includes('health') || name.includes('medicine')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('grooming') || name.includes('grooming') || name.includes('brush')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('litter') || name.includes('litter') || name.includes('box')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('car') || name.includes('car') || name.includes('seat') || name.includes('cover')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else {
                                                            e.target.src = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
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
                                                    data-tooltip="Edit Product"
                                                    onClick={() => editProduct(product._id)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-deactivate"
                                                    data-tooltip={product.available ? 'Deactivate' : 'Activate'}
                                                    onClick={() => toggleProductStatus(product._id)}
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
                    </div>

                    {/* Pet Management */}
                    <div className="content-section">
                        <div className="section-header">
                            <h2><i className="fas fa-paw"></i> Pet Management</h2>
                            <button
                                onClick={addNewPet}
                                className="btn btn-primary"
                                style={{
                                    maxWidth: '200px',
                                    minWidth: '110px',
                                    height: '36px',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                <i className="fas fa-plus"></i> Add Pet
                            </button>
                        </div>

                        <div className="products-grid">
                            {pets && pets.length > 0 ? (
                                pets.map(pet => (
                                    <div key={pet._id} className="product-card">
                                        <div className="product-image-container">
                                            <img
                                                src={`/api/images/pet/${pet._id}/0`}
                                                alt={pet.name}
                                                className="product-image"
                                                onError={(e) => {
                                                    console.log(`Pet image failed to load: ${e.target.src}`);
                                                    if (!e.target.dataset.fallbackAttempted) {
                                                        e.target.dataset.fallbackAttempted = 'true';
                                                        // Try alternative API endpoints
                                                        if (e.target.src.includes('localhost:8080')) {
                                                            e.target.src = `/api/images/pet/${pet._id}/0`;
                                                            return;
                                                        } else if (e.target.src.includes('/api/images/')) {
                                                            // If API also fails, show fallback
                                                            console.log('Pet image API failed, showing category-specific fallback');
                                                        }
                                                        // Pet category-specific fallback images
                                                        const category = pet.category?.toLowerCase() || '';
                                                        const breed = pet.breed?.toLowerCase() || '';

                                                        if (category.includes('dog') || breed.includes('dog')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('cat') || breed.includes('cat')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('bird') || breed.includes('bird') || breed.includes('parrot')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('fish') || breed.includes('fish') || breed.includes('betta')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else if (category.includes('rabbit') || breed.includes('rabbit')) {
                                                            e.target.src = 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        } else {
                                                            // Generic pet fallback
                                                            e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                                        }
                                                    } else {
                                                        // Final fallback if even the category-specific image fails
                                                        e.target.src = '/images/default-pet.jpg';
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
                                                    data-tooltip="Edit Pet"
                                                    onClick={() => editPet(pet._id)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-deactivate"
                                                    data-tooltip={pet.available !== false ? 'Mark Unavailable' : 'Mark Available'}
                                                    onClick={() => togglePetStatus(pet._id)}
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
                    </div>

                    {/* Orders Management */}
                    <div id="orders-section" className="content-section">
                        <div className="section-header">
                            <h2><i className="fas fa-shopping-bag"></i> Recent Orders</h2>
                            <div className="orders-stats">
                                <span className="stat-badge pending">
                                    <i className="fas fa-clock"></i>
                                    {statistics.pendingOrders} Pending
                                </span>
                            </div>
                        </div>

                        {orders && orders.length > 0 ? (
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
                                            {orders.map(order => (
                                                <tr key={order._id} className="order-row">
                                                    <td className="order-id">#{order.orderNumber || order._id?.slice(-6)}</td>
                                                    <td className="customer-name">{order.customer?.name || 'Unknown'}</td>
                                                    <td className="order-products">
                                                        {order.items?.map((item, index) => (
                                                            <div key={index} className="product-item">
                                                                <span className="product-name">
                                                                    {item.product?.name || `${item.itemType || 'Product'} (ID: ${item.product?._id?.slice(-6) || 'N/A'})`}
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
                    </div>

                    {/* Customer Reviews Section */}
                    <div id="reviews-section" className="content-section">
                        <div className="section-header">
                            <h2><i className="fas fa-star"></i> Customer Reviews</h2>
                        </div>

                        {reviews && reviews.length > 0 ? (
                            <div className="reviews-grid">
                                {reviews.map(review => (
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
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={{ ...user, ...seller }}
                onSave={handleSaveProfile}
            />
        </div>
    );
};

export default SellerDashboard;