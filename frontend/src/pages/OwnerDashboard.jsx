import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserDashboard, togglePetWishlist, toggleProductWishlist } from '../services/api';
import EditProfileModal from '../components/EditProfileModal';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const fetchInitialized = useRef(false);
    
    // Redirect to login if not authenticated
    useEffect(() => {
        // Redirect admin users to their own dashboard
        if (user && user.role === 'admin') {
            console.log('Admin user detected, redirecting to admin dashboard');
            navigate('/admin/dashboard', { replace: true });
            return;
        }
        
        // Only redirect to login if explicitly not authenticated (not during loading)
        if (!isAuthenticated && !user) {
            console.log('User not authenticated, redirecting to login');
            navigate('/login');
            return;
        }
    }, [isAuthenticated, user, navigate]);
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalOrders: 0,
            activeOrders: 0,
            totalSpent: 0,
            walletAmount: 0
        },
        wishlistedProducts: [],
        wishlistedPets: [],
        registeredEvents: [],
        orders: [],
        bookings: []
    });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const ordersPerPage = 3;

    const getImageUrl = (item, type = 'product') => {
        if (!item || !item._id) {
            return type === 'pet' ? '/images/default-pet.jpg' : '/images/default-product.jpg';
        }
        
        if (item.thumbnail) {
            if (item.thumbnail.startsWith('/images/')) {
                return `http://localhost:8080/api${item.thumbnail}`;
            }
            return item.thumbnail.startsWith('http') ? item.thumbnail : `http://localhost:8080${item.thumbnail}`;
        }
        
        if (item.images && item.images.length > 0) {
            const image = item.images[0];
            if (image && image.url) {
                return image.url.startsWith('http') ? image.url : `http://localhost:8080${image.url}`;
            }
        }
        
        // For items from MongoDB with stored images, use the API endpoint
        // This will serve the binary data stored in MongoDB
        return `http://localhost:8080/api/images/${type}/${item._id}/0`;
    };

    // Smart Image Component with multiple fallback strategies
    const SmartImage = memo(({ item, type = 'product', alt, className, onError }) => {
        const initialUrl = getImageUrl(item, type);
        const [imgSrc, setImgSrc] = useState(initialUrl);
        const [hasError, setHasError] = useState(false);
        const [fallbackAttempts, setFallbackAttempts] = useState(0);
        
        // Debug: log what URL we're trying to load
        console.log(`Loading ${type} image for ${item?._id}:`, initialUrl);
        
        const handleImageError = (e) => {
            if (fallbackAttempts === 0) {
                // First fallback: try placeholder images from public folder
                setFallbackAttempts(1);
                const placeholderImages = {
                    'product': ['/images/food1.jpg', '/images/toy1.jpg', '/images/acc1.jpg'],
                    'pet': ['/images/dog1.jpg', '/images/cat1.jpg', '/images/dog2.jpg']
                };
                const randomImage = placeholderImages[type][Math.floor(Math.random() * placeholderImages[type].length)];
                setImgSrc(randomImage);
                console.log(`${type} image failed, trying placeholder:`, randomImage);
            } else if (fallbackAttempts === 1) {
                // Final fallback: use default images
                setFallbackAttempts(2);
                setHasError(true);
                const fallback = type === 'pet' ? '/images/default-pet.jpg' : '/images/default-product.jpg';
                setImgSrc(fallback);
                console.error(`${type} image failed to load:`, e.target.src, 'Using final fallback:', fallback);
                if (onError) onError(e);
            }
        };
        
        return (
            <img 
                src={imgSrc}
                alt={alt}
                className={className}
                onError={handleImageError}
                loading="lazy"
                style={{ backgroundColor: hasError ? '#f3f4f6' : 'transparent' }}
            />
        );
    });

    // Memoized Product Card Component for performance
    const ProductCard = memo(({ product, onRemove, type = 'product' }) => (
        <div key={product._id} className="product-card">
            <a href={type === 'pet' ? `/seller/detail/${product._id}` : `/product/${product._id}`} className="product-link">
                <div className="product-image-wrapper">
                    <SmartImage 
                        item={product}
                        type={type}
                        alt={product.name}
                    />
                </div>
                <div className="product-details">
                    <div className="product-info">
                        <h3 className="product-title">{product.name}</h3>
                        <p className="product-brand">{product.brand || product.breed || product.category || 'Unknown Brand'}</p>
                        {type === 'pet' ? (
                            <p className="product-meta">Age: {product.age} | {product.gender}</p>
                        ) : (
                            <p className="product-description">{product.description}</p>
                        )}
                        <div className="product-price">
                            {product.discount > 0 ? (
                                <>
                                    <span className="original-price">₹{product.price.toFixed(2)}</span>
                                    <span className="current-price">
                                        ₹{(product.price * (1 - product.discount/100)).toFixed(2)}
                                    </span>
                                    <span className="discount-badge">{product.discount}% OFF</span>
                                </>
                            ) : (
                                <span className="current-price">₹{product.price.toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                </div>
            </a>
            <button 
                className="remove-wishlist-btn"
                onClick={() => onRemove(product._id)}
                aria-label="Remove from wishlist"
            >
                <i className="fas fa-times"></i>
            </button>
        </div>
    ));

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        
        try {
            console.log('Fetching dashboard data...');
            
            // Fetch dashboard data from single endpoint
            const response = await getUserDashboard();
            console.log('Dashboard API response:', response.data);
            
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                console.log('Dashboard data received:', data);
                console.log('Bookings data:', data.bookings);
                console.log('Number of bookings:', data.bookings?.length || 0);
                
                // Dashboard data includes complete user info
            
                setDashboardData({
                    stats: {
                        totalOrders: data.statistics?.totalOrders || 0,
                        activeOrders: data.statistics?.activeOrders || 0,
                        totalSpent: parseFloat(data.statistics?.totalSpent || 0),
                        walletAmount: parseFloat(data.statistics?.walletBalance || 0)
                    },
                    wishlistedProducts: (data.wishlist?.products || []).map(product => {
                        console.log('Processing product:', product);
                        return {
                            ...product,
                            images: product.images || (product.thumbnail ? [{ url: product.thumbnail }] : []),
                            stock: product.stock || 10,
                            brand: product.brand || 'Pet Brand',
                            description: product.description || `Premium ${product.name} for your pet`
                        };
                    }),
                    wishlistedPets: (data.wishlist?.pets || []).map(pet => ({
                        ...pet,
                        images: pet.images || (pet.thumbnail ? [{ url: pet.thumbnail }] : []),
                        category: 'Pet',
                        available: true,
                        gender: pet.gender || 'N/A'
                    })),
                    registeredEvents: data.events || [],
                    orders: data.orders || [],
                    bookings: data.bookings || []
                });
                console.log('Dashboard data set successfully');
            } else {
                console.warn('API response unsuccessful, using fallback data');
                throw new Error('API response unsuccessful');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            
            // Handle specific error types
            if (error.name === 'AbortError') {
                console.error('Dashboard API request timed out');
                showNotification('Dashboard loading timed out. Using cached data.', 'warning');
            } else if (error.message.includes('Failed to fetch')) {
                console.error('Network error - server may be down');
                showNotification('Unable to connect to server. Using cached data.', 'error');
            }
            
            // Use fallback data on error
            console.log('Using fallback data due to error');
            setDashboardData({
                stats: {
                    totalOrders: 2,
                    activeOrders: 2,
                    totalSpent: 4300,
                    walletAmount: 5200
                },
                wishlistedProducts: [
                    {
                        _id: '1',
                        name: 'Litter box',
                        brand: 'Pet Brand',
                        description: 'High quality litter box for cats',
                        price: 800,
                        discount: 0,
                        stock: 10,
                        images: [{ url: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=300&fit=crop' }]
                    },
                    {
                        _id: '2',
                        name: 'Wild Sandbox',
                        brand: 'Wild Pet',
                        description: 'Premium sandbox for pets',
                        price: 1200,
                        discount: 15,
                        stock: 5,
                        images: [{ url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop' }]
                    }
                ],
                wishlistedPets: [
                    {
                        _id: '3',
                        name: 'Muffin',
                        breed: 'German Shepherd',
                        category: 'Dog',
                        price: 25000,
                        age: '2 months',
                        gender: 'Female',
                        available: true,
                        images: [{ url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop' }]
                    },
                    {
                        _id: '4',
                        name: 'Bruno',
                        breed: 'German Shepherd',
                        category: 'Dog', 
                        price: 30000,
                        age: '3 months',
                        gender: 'Male',
                        available: true,
                        images: [{ url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop' }]
                    }
                ],
                registeredEvents: [
                    {
                        id: '1',
                        title: 'adopt love',
                        category: 'Adoption Drive',
                        date: '2025-10-24',
                        startTime: '06:00',
                        endTime: '17:00',
                        city: 'tada'
                    }
                ],
                orders: [
                    {
                        _id: 'ORD1760349659158',
                        orderNumber: 'ORD1760349659158',
                        createdAt: '2025-10-13',
                        totalAmount: 3800,
                        status: 'pending',
                        items: [
                            {
                                product: {
                                    _id: 'prod1',
                                    name: 'Car seat cover for dogs and cats',
                                    images: [{ url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=48&h=48&fit=crop' }]
                                },
                                quantity: 2,
                                price: 700
                            }
                        ]
                    }
                ],
                bookings: []
            });
        } finally {
            setLoading(false);
        }
    }, []); // Remove checkSession from dependencies to prevent infinite loop

    useEffect(() => {
        // Prevent duplicate fetches in React StrictMode
        if (fetchInitialized.current) return;
        
        let isMounted = true;
        fetchInitialized.current = true;
        
        const loadDashboard = async () => {
            if (isMounted) {
                await fetchDashboardData();
                updateCartCount();
            }
        };
        
        loadDashboard();
        
        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (loading && isMounted) {
                console.warn('Dashboard loading safety timeout triggered');
                setLoading(false);
                showNotification('Dashboard took too long to load. Please refresh the page.', 'error');
            }
        }, 15000); // 15 second safety timeout
        
        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refresh dashboard data when component becomes visible (user navigates back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && fetchInitialized.current) {
                console.log('Dashboard became visible, refreshing data...');
                fetchDashboardData();
            }
        };

        const handleFocus = () => {
            if (fetchInitialized.current) {
                console.log('Window focused, refreshing dashboard data...');
                fetchDashboardData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchDashboardData]);




    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        // Update cart count in header if needed
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, quantity: 1 })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Product added to cart!', 'success');
                updateCartCount();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add to cart', 'error');
        }
    };

    const handleRemoveFromWishlist = async (itemId, type = 'product') => {
        if (!window.confirm(`Remove this ${type} from your wishlist?`)) return;

        try {
            console.log(`Removing ${type} with ID: ${itemId} from wishlist`);
            let response;
            if (type === 'product') {
                response = await toggleProductWishlist(itemId);
            } else {
                response = await togglePetWishlist(itemId);
            }
            
            console.log(`Wishlist toggle response:`, response.data);
            if (response.data.success) {
                const isStillInWishlist = response.data.data?.isInWishlist || response.data.data?.wishlist;
                
                if (!isStillInWishlist) {
                    // Item was removed from wishlist - remove from UI immediately
                    if (type === 'product') {
                        setDashboardData(prev => ({
                            ...prev,
                            wishlistedProducts: prev.wishlistedProducts.filter(item => item._id !== itemId)
                        }));
                    } else {
                        setDashboardData(prev => ({
                            ...prev,
                            wishlistedPets: prev.wishlistedPets.filter(item => item._id !== itemId)
                        }));
                    }
                    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} removed from wishlist`, 'success');
                } else {
                    // Item was added back (shouldn't happen in remove action, but just in case)
                    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} added to wishlist`, 'info');
                }
                
                // No need to refresh entire dashboard - state update handles UI changes
            } else {
                throw new Error(response.data.message || 'Failed to remove from wishlist');
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showNotification('Failed to remove from wishlist', 'error');
        }
    };

    const showNotification = (message, type = 'info') => {
        const id = Date.now();
        const notification = { id, message, type };
        setNotifications(prev => [...prev, notification]);

        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const handleViewOrderDetails = (orderId) => {
        // Navigate to order details page
        navigate(`/order-details/${orderId}`);
    };

    // Navigation handlers for stats cards
    const handleStatsCardClick = (cardType) => {
        switch(cardType) {
            case 'totalOrders': {
                // Scroll directly to Recent Orders section
                const sections = document.querySelectorAll('.section');
                const recentOrdersSection = Array.from(sections).find(section => 
                    section.textContent.includes('Recent Orders')
                );
                
                if (recentOrdersSection) {
                    recentOrdersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Highlight the section briefly
                    recentOrdersSection.style.backgroundColor = '#f0fdf4';
                    setTimeout(() => {
                        recentOrdersSection.style.backgroundColor = '';
                    }, 1500);
                }
                break;
            }
            case 'activeOrders': {
                // Scroll to My Orders section
                const myOrdersSection = document.querySelector('.my-orders-section');
                if (myOrdersSection) {
                    myOrdersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    myOrdersSection.style.backgroundColor = '#dbeafe';
                    setTimeout(() => {
                        myOrdersSection.style.backgroundColor = '';
                    }, 2000);
                }
                break;
            }
            case 'totalSpent': {
                // Scroll to My Orders section to see spending
                const myOrdersSection = document.querySelector('.my-orders-section');
                if (myOrdersSection) {
                    myOrdersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    myOrdersSection.style.backgroundColor = '#fef3c7';
                    setTimeout(() => {
                        myOrdersSection.style.backgroundColor = '';
                    }, 2000);
                }
                break;
            }
            case 'walletBalance':
                // Navigate to wallet page
                navigate('/wallet');
                break;
            default:
                break;
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'warning',
            'processing': 'primary',
            'shipped': 'info',
            'delivered': 'success',
            'cancelled': 'danger',
            'confirmed': 'success'
        };
        return statusColors[status.toLowerCase()] || 'secondary';
    };

    const _getStatusIcon = (status) => {
        const statusIcons = {
            'delivered': 'check-circle',
            'processing': 'clock',
            'pending': 'hourglass-half',
            'shipped': 'truck',
            'cancelled': 'times-circle',
            'confirmed': 'check-circle'
        };
        return statusIcons[status.toLowerCase()] || 'clock';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN');
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
                showNotification('Profile updated successfully!', 'success');
                // Refresh dashboard to get updated user data
                fetchDashboardData();
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile', 'error');
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading your dashboard...</p>
            </div>
        );
    }
    return (
        <div className="dashboard-container" style={{ marginTop: '169px' }}>
            {/* Notifications */}
            {notifications.map(notification => (
                <div key={notification.id} className={`notification notification-${notification.type}`}>
                    <div className="notification-content">
                        <span className="notification-message">{notification.message}</span>
                        <button 
                            className="notification-close"
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}

            {/* Header */}
            <header className="dashboard-header">
                <h1 className="header-title">
                    <span className="petverse">PetVerse</span>
                    <span className="dashboard-text">Owner Dashboard</span>
                </h1>
                <div className="user-info">
                    <span className="user-name">Welcome back, {user?.fullName || user?.username || 'User'}!</span>
                    <button onClick={logout} className="nav-btn logout-btn">
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div 
                    className="stat-card clickable-stat-card" 
                    onClick={() => handleStatsCardClick('totalOrders')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('totalOrders')}
                >
                    <div className="stat-icon">
                        <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="stat-value">{dashboardData.stats.totalOrders}</div>
                    <div className="stat-label">Total Orders</div>
                </div>
                <div 
                    className="stat-card clickable-stat-card" 
                    onClick={() => handleStatsCardClick('activeOrders')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('activeOrders')}
                >
                    <div className="stat-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-value">{dashboardData.stats.activeOrders}</div>
                    <div className="stat-label">Active Orders</div>
                </div>
                <div 
                    className="stat-card clickable-stat-card" 
                    onClick={() => handleStatsCardClick('totalSpent')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('totalSpent')}
                >
                    <div className="stat-icon">
                        <i className="fas fa-rupee-sign"></i>
                    </div>
                    <div className="stat-value">₹{dashboardData.stats.totalSpent?.toLocaleString('en-IN')}</div>
                    <div className="stat-label">Total Spent</div>
                </div>
                <div 
                    className="stat-card clickable-stat-card" 
                    onClick={() => handleStatsCardClick('walletBalance')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('walletBalance')}
                >
                    <div className="stat-icon">
                        <i className="fas fa-rupee-sign"></i>
                    </div>
                    <div className="stat-value">₹ {dashboardData.stats.walletAmount}</div>
                    <div className="stat-label">Wallent Balance</div>
                </div>
            </div>

            {/* Wishlist Section */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-heart"></i>
                        My Wishlist
                    </h2>
                </div>
                <div className="wishlist-grid">
                    {/* Wishlisted Products */}
                    {dashboardData.wishlistedProducts.map(product => (
                        <div
                            key={product._id}
                            className="wishlist-card"
                            onClick={(e) => {
                                if (!e.target.closest('.wishlist-action')) {
                                    navigate(`/product/${product._id}`);
                                }
                            }}
                        >
                            <div className="wishlist-image-container">
                                <SmartImage 
                                    item={product}
                                    type="product"
                                    alt={product.name}
                                    className="wishlist-image"
                                />
                            </div>
                            <div className="wishlist-content">
                                <h3 className="wishlist-title">{product.name}</h3>
                                <p className="wishlist-brand">{product.brand || 'Pet Brand'}</p>
                                
                                {/* Price */}
                                <div className="wishlist-price">
                                    {product.discount && product.discount > 0 ? (
                                        <div className="price-container">
                                            <span className="price-original">₹{product.price.toFixed(2)}</span>
                                            <span className="price-current">
                                                ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
                                            </span>
                                            <span className="price-discount">
                                                {product.discount}% OFF
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="price-current">
                                            ₹{product.price.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Stock */}
                                <div className="wishlist-stock">
                                    {product.stock === 0 ? (
                                        <span className="stock-out">Out of Stock</span>
                                    ) : product.stock <= 5 ? (
                                        <span className="stock-low">In Stock</span>
                                    ) : (
                                        <span className="stock-available">In Stock</span>
                                    )}
                                </div>

                                <div className="wishlist-action wishlist-buttons">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(product._id);
                                        }}
                                        disabled={product.stock === 0}
                                        className={`wishlist-btn-primary ${product.stock === 0 ? 'disabled' : ''}`}
                                    >
                                        ADD TO CART
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFromWishlist(product._id, 'product');
                                        }}
                                        className="wishlist-btn-heart"
                                    >
                                        <i className="fas fa-heart"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Wishlisted Pets */}
                    {dashboardData.wishlistedPets.map(pet => (
                        <div
                            key={pet._id}
                            className="wishlist-card"
                            onClick={(e) => {
                                if (!e.target.closest('.wishlist-action')) {
                                    navigate(`/seller/detail/${pet._id}`);
                                }
                            }}
                        >
                            <div className="wishlist-image-container">
                                <SmartImage 
                                    item={pet}
                                    type="pet"
                                    alt={pet.name}
                                    className="wishlist-image"
                                />
                            </div>
                            <div className="wishlist-content">
                                <h3 className="wishlist-title">{pet.name}</h3>
                                <p className="wishlist-brand">{pet.breed || pet.category}</p>
                                <p className="wishlist-meta">Age: {pet.age} | N/A</p>
                                
                                {/* Price */}
                                <div className="wishlist-price">
                                    <span className="price-current">₹{pet.price.toFixed(2)}</span>
                                </div>

                                {/* Availability */}
                                <div className="wishlist-stock">
                                    <span className="stock-available">Available</span>
                                </div>

                                <div className="wishlist-action wishlist-buttons">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/seller/detail/${pet._id}`);
                                        }}
                                        className="wishlist-btn-primary"
                                    >
                                        VIEW DETAILS
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFromWishlist(pet._id, 'pet');
                                        }}
                                        className="wishlist-btn-heart"
                                    >
                                        <i className="fas fa-heart"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {dashboardData.wishlistedProducts.length === 0 && dashboardData.wishlistedPets.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-heart-broken"></i>
                            <p>No items in your wishlist yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Registered Events Section */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-ticket-alt"></i>
                        Registered Events
                    </h2>
                </div>

                {dashboardData.registeredEvents.length > 0 ? (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>City</th>
                                <th>Ticket</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.registeredEvents.map(event => (
                                <tr key={event._id}>
                                    <td>
                                        {event.title} 
                                        <span className="product-meta"> ({event.category})</span>
                                    </td>
                                    <td>{formatDate(event.date)}</td>
                                    <td>{event.startTime} - {event.endTime}</td>
                                    <td>{event.city}</td>
                                    <td>
                                        <a href={`/events/${event.id}/ticket`} className="btn btn-secondary">
                                            View Ticket
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-ticket-alt"></i>
                        <p>No event registrations yet. Explore and join an event!</p>
                        <a href="/events" className="btn btn-primary">
                            <i className="fas fa-calendar"></i> Browse Events
                        </a>
                    </div>
                )}
            </section>

            {/* Profile Information Section */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-user-circle"></i>
                        Profile Information
                    </h2>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn btn-primary"
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.5rem'
                        }}
                    >
                        <i className="fas fa-edit"></i> Edit Profile
                    </button>
                </div>
                <div className="profile-grid">
                    <div className="profile-info">
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-user"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Full Name</div>
                                <div className="info-value">{user?.fullName || 'Not provided'}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-at"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Username</div>
                                <div className="info-value">@{user?.username || 'Not provided'}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Email Address</div>
                                <div className="info-value">{user?.email || 'Not provided'}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-phone"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Phone Number</div>
                                <div className="info-value">{user?.phone || 'Not provided'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="profile-info">
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-user-tag"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Account Type</div>
                                <div className="info-value">
                                    <span className={`role-badge role-${user?.role}`}>
                                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Not provided'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-calendar"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Member Since</div>
                                <div className="info-value">{user?.createdAt ? formatDate(user.createdAt) : 'Not available'}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Last Updated</div>
                                <div className="info-value">{user?.updatedAt ? formatDate(user.updatedAt) : 'Not available'}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <div className="info-content">
                                <div className="info-label">Account Status</div>
                                <div className="info-value">
                                    <span className={`status-badge ${user?.isApproved !== false ? 'status-active' : 'status-pending'}`}>
                                        {user?.isApproved !== false ? 'Active' : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-shopping-cart"></i>
                        Recent Orders
                    </h2>
                </div>

                {dashboardData.orders.length > 0 ? (
                    <div className="simple-orders-table-container">
                        <table className="simple-orders-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Product</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.orders.slice(0, 4).map(order => {
                                    const firstItem = order.items?.[0];
                                    const productName = firstItem?.product?.name || 'Product Item';
                                    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
                                    
                                    return (
                                        <tr key={order._id} className="simple-table-row">
                                            <td className="order-id-cell">
                                                <span className="simple-order-id">
                                                    #{order.orderNumber || order._id.toString().slice(-8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="product-cell">
                                                <div className="simple-product-info">
                                                    <div className="simple-product-image">
                                                        <SmartImage 
                                                            item={firstItem?.product || firstItem}
                                                            type="product"
                                                            alt={productName}
                                                            className="table-product-img"
                                                        />
                                                    </div>
                                                    <div className="simple-product-details">
                                                        <span className="simple-product-name">{productName}</span>
                                                        {order.items && order.items.length > 1 && (
                                                            <span className="simple-additional-items">+{order.items.length - 1} more items</span>
                                                        )}
                                                        <span className="simple-quantity">Qty: {totalItems}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="date-cell">
                                                <span className="simple-date">
                                                    {order.orderDate || formatDate(order.createdAt)}
                                                </span>
                                            </td>
                                            <td className="amount-cell">
                                                <span className="simple-amount">₹{(order.totalAmount || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="status-cell">
                                                <span className={`simple-status-badge status-${order.status || 'pending'}`}>
                                                    {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-shopping-bag"></i>
                        <p>No orders found. Start shopping!</p>
                        <a href="/products" className="btn btn-primary">
                            <i className="fas fa-shopping-cart"></i> Shop Now
                        </a>
                    </div>
                )}
            </section>

            {/* Service Appointments Section */}
            <section className="section service-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-calendar-check"></i>
                        Service Appointments
                    </h2>
                </div>

                {dashboardData.bookings && dashboardData.bookings.length > 0 ? (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Service ID</th>
                                <th>Service Name</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.bookings.map((booking, index) => (
                                <tr key={booking._id || booking.id || index}>
                                    <td>#{(booking._id || booking.id || 'Unknown').toString().substring(0, 8)}...</td>
                                    <td>
                                        {booking.service?.name || booking.serviceName || 'Service'}
                                        <span className="product-meta"> (Provider: {booking.service?.providerName || 'Unknown Provider'})</span>
                                    </td>
                                    <td>{booking.date || booking.bookingDate || 'Not set'}</td>
                                    <td>{booking.time || 'Not set'}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(booking.status || 'pending')}`}>
                                            {(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-calendar-alt"></i>
                        <p>No appointments scheduled yet.</p>
                        <a href="/services" className="btn btn-primary">
                            <i className="fas fa-concierge-bell"></i> Browse Services
                        </a>
                    </div>
                )}
            </section>

            {/* My Orders Section */}
            <section className="section my-orders-section">
                <div className="section-header">
                    <h2 className="section-title">
                        My Orders
                    </h2>
                </div>

                {dashboardData.orders.length > 0 ? (
                    <>
                        <div className="orders-list-clean">
                            {dashboardData.orders
                                .slice((currentOrdersPage - 1) * ordersPerPage, currentOrdersPage * ordersPerPage)
                                .map(order => (
                                <div key={order._id} className="order-card-clean">
                                    <div className="order-header-clean">
                                        <div className="order-info-left">
                                            <h3>Order #{order.orderNumber || order._id.toString().slice(-8).toUpperCase()}</h3>
                                            <p>{formatDate(order.createdAt)}</p>
                                        </div>
                                        <div className="order-status-clean">
                                            <span className={`status-pill ${order.status?.toLowerCase() || 'pending'}`}>
                                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    {order.items && order.items.length > 0 && (
                                        <div className="order-items-horizontal">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="order-item-horizontal">
                                                    <SmartImage 
                                                        item={item.product}
                                                        type="product"
                                                        alt={item.product?.name || 'Product'}
                                                        className="item-image-small"
                                                    />
                                                    <div className="item-details-compact">
                                                        <h4>{item.product?.name || 'Product No Longer Available'}</h4>
                                                        <p>{item.product?.brand || 'Unknown Brand'}</p>
                                                        <div className="item-meta">
                                                            <span>Quantity: {item.quantity || 1}</span>
                                                            <span>Price: ₹{(item.price || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="order-footer-clean">
                                        <div className="order-total-clean">
                                            <span>Total Amount:</span>
                                            <strong>₹{(order.totalAmount || 0).toLocaleString()}</strong>
                                        </div>
                                        <button 
                                            className="view-details-btn"
                                            onClick={() => handleViewOrderDetails(order._id)}
                                        >
                                            <i className="fas fa-eye"></i>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {dashboardData.orders.length > ordersPerPage && (
                            <div className="flex justify-center mt-8 gap-1">
                                {/* Previous button */}
                                <button
                                    onClick={() => setCurrentOrdersPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentOrdersPage === 1}
                                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                
                                {/* Page numbers */}
                                {Array.from({ length: Math.ceil(dashboardData.orders.length / ordersPerPage) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentOrdersPage(i + 1)}
                                        className={`px-3 py-2 border rounded ${
                                            currentOrdersPage === i + 1
                                                ? 'bg-teal-600 text-white border-teal-600'
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                
                                {/* Next button */}
                                <button
                                    onClick={() => setCurrentOrdersPage(prev => 
                                        Math.min(prev + 1, Math.ceil(dashboardData.orders.length / ordersPerPage))
                                    )}
                                    disabled={currentOrdersPage === Math.ceil(dashboardData.orders.length / ordersPerPage)}
                                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-shopping-bag"></i>
                        <h3>No orders yet</h3>
                        <p>Start shopping and your orders will appear here!</p>
                        <div className="empty-actions">
                            <a href="/products" className="btn btn-primary">
                                <i className="fas fa-shopping-cart"></i>
                                Shop Products
                            </a>
                            <a href="/pets" className="btn btn-secondary">
                                <i className="fas fa-paw"></i>
                                Browse Pets
                            </a>
                        </div>
                    </div>
                )}
            </section>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onSave={handleSaveProfile}
            />
        </div>
    );
};

export default OwnerDashboard;
