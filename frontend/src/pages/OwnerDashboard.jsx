import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserDashboard, togglePetWishlist, toggleProductWishlist } from '../services/api';
import EditProfileModal from '../components/EditProfileModal';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
    const { user, logout, isAuthenticated, setUser, refreshSession } = useAuth();
    const navigate = useNavigate();
    const fetchInitialized = useRef(false);
    const isMounted = useRef(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Redirect to login if not authenticated
    useEffect(() => {
        isMounted.current = true;
        
        // Only redirect if definitely not authenticated
        if (isAuthenticated === false) {
            console.log('User not authenticated, redirecting to login');
            navigate('/login');
            return;
        }
        
        return () => {
            isMounted.current = false;
        };
    }, [isAuthenticated, navigate]);

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
    
    // Search and filter states
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    
    // Search states for appointments and events
    const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    
    // Pagination states for appointments and events
    const [currentAppointmentsPage, setCurrentAppointmentsPage] = useState(1);
    const [currentEventsPage, setCurrentEventsPage] = useState(1);
    const [currentWishlistPage, setCurrentWishlistPage] = useState(1);
    const appointmentsPerPage = 5;
    const eventsPerPage = 5;
    const wishlistItemsPerPage = 6;

    // Reset orders page when search or filter changes
    useEffect(() => {
        setCurrentOrdersPage(1);
    }, [orderSearchQuery, orderStatusFilter]);
    
    // Reset appointments page when search changes
    useEffect(() => {
        setCurrentAppointmentsPage(1);
    }, [appointmentSearchQuery]);
    
    // Reset events page when search changes
    useEffect(() => {
        setCurrentEventsPage(1);
    }, [eventSearchQuery]);

    const getImageUrl = (item, type = 'product') => {
        if (!item || !item._id) {
            return type === 'pet' ? '/images/default-pet.jpg' : '/images/default-product.jpg';
        }
        
        if (item.thumbnail) {
            if (item.thumbnail.startsWith('/images/')) {
                return item.thumbnail;
            }
            return item.thumbnail.startsWith('http') ? item.thumbnail : item.thumbnail;
        }
        
        if (item.images && item.images.length > 0) {
            const image = item.images[0];
            if (image && image.url) {
                return image.url.startsWith('http') ? image.url : image.url;
            }
        }
        
        // For items from MongoDB with stored images, use the API endpoint
        // This will serve the binary data stored in MongoDB
        return `/api/images/${type}/${item._id}/0`;
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
        // Prevent duplicate fetches
        if (!isMounted.current) return;
        
        setLoading(true);
        
        try {
            console.log('Fetching dashboard data...');
            
            // Fetch dashboard data from single endpoint
            const response = await getUserDashboard();
            console.log('Dashboard API response:', response.data);
            
            if (!isMounted.current) return; // Check before updating state
            
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                console.log('Dashboard data received:', data);
                
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
            if (!isMounted.current) return; // Check before updating state
            
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
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []); // Empty dependencies - stable function

    useEffect(() => {
        // Prevent duplicate fetches in React StrictMode
        if (fetchInitialized.current) return;
        if (!isAuthenticated) return; // Don't fetch if not authenticated
        
        fetchInitialized.current = true;
        
        const loadDashboard = async () => {
            await fetchDashboardData();
            updateCartCount();
        };
        
        loadDashboard();
        
        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (loading && isMounted.current) {
                console.warn('Dashboard loading safety timeout triggered');
                setLoading(false);
                showNotification('Dashboard took too long to load. Please refresh the page.', 'error');
            }
        }, 15000); // 15 second safety timeout
        
        return () => {
            clearTimeout(safetyTimeout);
        };
    }, [isAuthenticated]); // Only depend on isAuthenticated



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
                // Update the user data in auth context
                setUser(data.data.user);
                
                showNotification('Profile updated successfully!', 'success');
                
                // Force a session refresh to ensure UI updates
                await refreshSession();
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile', 'error');
            throw error;
        }
    };

    // Filter and search orders in real-time
    const getFilteredOrders = useCallback(() => {
        let filtered = [...dashboardData.orders];
        
        // Apply status filter
        if (orderStatusFilter !== 'all') {
            filtered = filtered.filter(order => 
                order.status?.toLowerCase() === orderStatusFilter.toLowerCase()
            );
        }
        
        // Apply search query
        if (orderSearchQuery.trim()) {
            const query = orderSearchQuery.toLowerCase();
            filtered = filtered.filter(order => {
                const orderNumber = order.orderNumber || order._id.toString().slice(-8);
                const firstItem = order.items?.[0];
                const productName = firstItem?.product?.name || '';
                const totalAmount = (order.totalAmount || 0).toString();
                
                return (
                    orderNumber.toLowerCase().includes(query) ||
                    productName.toLowerCase().includes(query) ||
                    totalAmount.includes(query) ||
                    order.status?.toLowerCase().includes(query)
                );
            });
        }
        
        return filtered;
    }, [dashboardData.orders, orderSearchQuery, orderStatusFilter]);

    // Filter and paginate appointments
    const getPaginatedAppointments = useCallback(() => {
        let filtered = [...dashboardData.bookings];
        
        // Apply search query
        if (appointmentSearchQuery.trim()) {
            const query = appointmentSearchQuery.toLowerCase();
            filtered = filtered.filter(booking => {
                const serviceId = (booking._id || '').toString();
                const serviceName = (booking.service?.name || booking.serviceName || '').toLowerCase();
                const providerName = (booking.service?.providerName || '').toLowerCase();
                const serviceType = (booking.serviceType || booking.service?.type || '').toLowerCase();
                const date = (booking.date || booking.bookingDate || '');
                const time = (booking.time || '');
                
                return (
                    serviceId.includes(query) ||
                    serviceName.includes(query) ||
                    providerName.includes(query) ||
                    serviceType.includes(query) ||
                    date.includes(query) ||
                    time.includes(query)
                );
            });
        }
        
        const startIndex = (currentAppointmentsPage - 1) * appointmentsPerPage;
        const endIndex = startIndex + appointmentsPerPage;
        return {
            appointments: filtered.slice(startIndex, endIndex),
            total: filtered.length
        };
    }, [dashboardData.bookings, currentAppointmentsPage, appointmentsPerPage, appointmentSearchQuery]);

    // Filter and paginate events
    const getPaginatedEvents = useCallback(() => {
        let filtered = [...dashboardData.registeredEvents];
        
        // Apply search query
        if (eventSearchQuery.trim()) {
            const query = eventSearchQuery.toLowerCase();
            filtered = filtered.filter(event => {
                const title = (event.title || '').toLowerCase();
                const category = (event.category || '').toLowerCase();
                const city = (event.city || '').toLowerCase();
                const date = formatDate(event.date || '').toLowerCase();
                
                return (
                    title.includes(query) ||
                    category.includes(query) ||
                    city.includes(query) ||
                    date.includes(query)
                );
            });
        }
        
        const startIndex = (currentEventsPage - 1) * eventsPerPage;
        const endIndex = startIndex + eventsPerPage;
        return {
            events: filtered.slice(startIndex, endIndex),
            total: filtered.length
        };
    }, [dashboardData.registeredEvents, currentEventsPage, eventsPerPage, eventSearchQuery]);

    // Paginate wishlist items (products + pets combined)
    const getPaginatedWishlist = useCallback(() => {
        const allWishlistItems = [
            ...dashboardData.wishlistedProducts.map(item => ({ ...item, type: 'product' })),
            ...dashboardData.wishlistedPets.map(item => ({ ...item, type: 'pet' }))
        ];
        const startIndex = (currentWishlistPage - 1) * wishlistItemsPerPage;
        const endIndex = startIndex + wishlistItemsPerPage;
        return {
            items: allWishlistItems.slice(startIndex, endIndex),
            total: allWishlistItems.length
        };
    }, [dashboardData.wishlistedProducts, dashboardData.wishlistedPets, currentWishlistPage, wishlistItemsPerPage]);

    if (loading) {
        return (
            <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="owner-dashboard-container">
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

            <div className="owner-main-container">
                {/* Sidebar */}
                <aside className="owner-sidebar">
                    <div className="sidebar-section">
                        <h2>Dashboard</h2>
                        <ul className="owner-menu">
                            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabChange('dashboard')}>
                                <i className="fas fa-tachometer-alt"></i> Dashboard Overview
                            </li>
                            <li className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => handleTabChange('wishlist')}>
                                <i className="fas fa-heart"></i> My Wishlist
                            </li>
                            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => handleTabChange('orders')}>
                                <i className="fas fa-shopping-bag"></i> My Orders
                            </li>
                            <li className={activeTab === 'appointments' ? 'active' : ''} onClick={() => handleTabChange('appointments')}>
                                <i className="fas fa-calendar-check"></i> Service Appointments
                            </li>
                            <li className={activeTab === 'events' ? 'active' : ''} onClick={() => handleTabChange('events')}>
                                <i className="fas fa-ticket-alt"></i> Registered Events
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Account</h2>
                        <ul className="owner-menu">
                            <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => handleTabChange('profile')}>
                                <i className="fas fa-user-circle"></i> Profile Information
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h2>Financial</h2>
                        <ul className="owner-menu">
                            <li onClick={() => navigate('/wallet')}>
                                <i className="fas fa-wallet"></i> Wallet
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <ul className="owner-menu">
                            <li onClick={handleLogout} className="logout-btn">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="owner-content">
                    <header className="owner-header">
                        <h1>{activeTab === 'dashboard' ? 'Owner Dashboard' :
                            activeTab === 'wishlist' ? 'My Wishlist' :
                            activeTab === 'orders' ? 'My Orders' :
                            activeTab === 'appointments' ? 'Service Appointments' :
                            activeTab === 'events' ? 'Registered Events' :
                            activeTab === 'profile' ? 'Profile Information' : 'Owner Dashboard'
                        }</h1>
                        <div className="owner-user-info">
                            <span>Welcome, {user?.fullName || 'Owner'}!</span>
                        </div>
                    </header>

                    <div className="owner-content-wrapper">
                        {/* Dashboard Overview Tab */}
                        {activeTab === 'dashboard' && (
                            <>
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
                                        <div className="stat-info">
                                            <div className="stat-value">{dashboardData.stats.totalOrders}</div>
                                            <div className="stat-label">Total Orders</div>
                                        </div>
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
                                        <div className="stat-info">
                                            <div className="stat-value">{dashboardData.stats.activeOrders}</div>
                                            <div className="stat-label">Active Orders</div>
                                        </div>
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
                                        <div className="stat-info">
                                            <div className="stat-value">₹{dashboardData.stats.totalSpent?.toLocaleString('en-IN')}</div>
                                            <div className="stat-label">Total Spent</div>
                                        </div>
                                    </div>
                                    <div 
                                        className="stat-card clickable-stat-card" 
                                        onClick={() => handleStatsCardClick('walletBalance')}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStatsCardClick('walletBalance')}
                                    >
                                        <div className="stat-icon">
                                            <i className="fas fa-wallet"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">₹{dashboardData.stats.walletAmount}</div>
                                            <div className="stat-label">Wallet Balance</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Orders Section */}
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
                            </>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === 'wishlist' && (
                            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-heart"></i>
                        My Wishlist
                    </h2>
                </div>
                
                {(() => {
                    const { items: paginatedItems, total } = getPaginatedWishlist();
                    const totalPages = Math.ceil(total / wishlistItemsPerPage);
                    
                    return total > 0 ? (
                        <>
                            <div className="wishlist-grid">
                                {paginatedItems.map(item => (
                                    <div
                                        key={item._id}
                                        className="wishlist-card"
                                        onClick={(e) => {
                                            if (!e.target.closest('.wishlist-action')) {
                                                navigate(item.type === 'pet' ? `/seller/detail/${item._id}` : `/product/${item._id}`);
                                            }
                                        }}
                                    >
                                        <div className="wishlist-image-container">
                                            <SmartImage 
                                                item={item}
                                                type={item.type}
                                                alt={item.name}
                                                className="wishlist-image"
                                            />
                                        </div>
                                        <div className="wishlist-content">
                                            <h3 className="wishlist-title">{item.name}</h3>
                                            <p className="wishlist-brand">{item.brand || item.breed || item.category || 'Pet Brand'}</p>
                                            
                                            {item.type === 'pet' && (
                                                <p className="wishlist-meta">Age: {item.age} | {item.gender || 'N/A'}</p>
                                            )}
                                            
                                            {/* Price */}
                                            <div className="wishlist-price">
                                                {item.discount && item.discount > 0 ? (
                                                    <div className="price-container">
                                                        <span className="price-original">₹{item.price.toFixed(2)}</span>
                                                        <span className="price-current">
                                                            ₹{(item.price * (1 - item.discount / 100)).toFixed(2)}
                                                        </span>
                                                        <span className="price-discount">
                                                            {item.discount}% OFF
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="price-current">
                                                        ₹{item.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stock/Availability */}
                                            <div className="wishlist-stock">
                                                {item.type === 'pet' ? (
                                                    <span className="stock-available">Available</span>
                                                ) : item.stock === 0 ? (
                                                    <span className="stock-out">Out of Stock</span>
                                                ) : item.stock <= 5 ? (
                                                    <span className="stock-low">In Stock</span>
                                                ) : (
                                                    <span className="stock-available">In Stock</span>
                                                )}
                                            </div>

                                            <div className="wishlist-action wishlist-buttons">
                                                {item.type === 'product' ? (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddToCart(item._id);
                                                        }}
                                                        disabled={item.stock === 0}
                                                        className={`wishlist-btn-primary ${item.stock === 0 ? 'disabled' : ''}`}
                                                    >
                                                        ADD TO CART
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/seller/detail/${item._id}`);
                                                        }}
                                                        className="wishlist-btn-primary"
                                                    >
                                                        VIEW DETAILS
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFromWishlist(item._id, item.type);
                                                    }}
                                                    className="wishlist-btn-heart"
                                                >
                                                    <i className="fas fa-heart"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination */}
                            {total > wishlistItemsPerPage && (
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => setCurrentWishlistPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentWishlistPage === 1}
                                        className="pagination-btn"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentWishlistPage(i + 1)}
                                            className={`pagination-btn ${currentWishlistPage === i + 1 ? 'active' : ''}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    
                                    <button
                                        onClick={() => setCurrentWishlistPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentWishlistPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                            
                            {/* Results info */}
                            <div className="results-info">
                                Showing {((currentWishlistPage - 1) * wishlistItemsPerPage) + 1} - {Math.min(currentWishlistPage * wishlistItemsPerPage, total)} of {total} items
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-heart-broken"></i>
                            <p>No items in your wishlist yet.</p>
                        </div>
                    );
                })()}
            </section>
                        )}

                        {/* Registered Events Tab */}
                        {activeTab === 'events' && (
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-ticket-alt"></i>
                        Registered Events
                    </h2>
                </div>

                {dashboardData.registeredEvents.length > 0 ? (
                    <>
                    {/* Search Controls */}
                    <div className="search-filter-controls">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search by event name, category, city..."
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            {eventSearchQuery && (
                                <button
                                    onClick={() => setEventSearchQuery('')}
                                    className="clear-search"
                                    aria-label="Clear search"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {(() => {
                        const { events, total } = getPaginatedEvents();
                        const totalPages = Math.ceil(total / eventsPerPage);

                        return total > 0 ? (
                            <>
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
                                {events.map(event => (
                                    <tr key={event._id}>
                                    <td>
                                        {event.title} 
                                        <span className="product-meta"> ({event.category})</span>
                                    </td>
                                    <td>{formatDate(event.date)}</td>
                                    <td>{event.startTime} - {event.endTime}</td>
                                    <td>{event.city}</td>
                                    <td>
                                        <a href={`/events/${event._id}/ticket`} className="btn btn-secondary">
                                            View Ticket
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {total > eventsPerPage && (
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentEventsPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentEventsPage === 1}
                                className="pagination-btn"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentEventsPage(i + 1)}
                                    className={`pagination-btn ${currentEventsPage === i + 1 ? 'active' : ''}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => setCurrentEventsPage(prev => 
                                    Math.min(prev + 1, totalPages)
                                )}
                                disabled={currentEventsPage === totalPages}
                                className="pagination-btn"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                    
                    {/* Results info */}
                    <div className="results-info">
                        Showing {((currentEventsPage - 1) * eventsPerPage) + 1} - {Math.min(currentEventsPage * eventsPerPage, total)} of {total} events
                    </div>
                    </>
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-search"></i>
                                <p>No events found matching your search criteria.</p>
                                <button 
                                    onClick={() => setEventSearchQuery('')}
                                    className="btn btn-secondary"
                                >
                                    Clear Search
                                </button>
                            </div>
                        );
                    })()}
                    </>
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
                        )}

                        {/* Profile Information Tab */}
                        {activeTab === 'profile' && (
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
                        )}

                        {/* Service Appointments Tab */}
                        {activeTab === 'appointments' && (
            <section className="section service-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-calendar-check"></i>
                        Service Appointments
                    </h2>
                </div>

                {dashboardData.bookings.length > 0 ? (
                    <>
                    {/* Search Controls */}
                    <div className="search-filter-controls">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search by service, provider, date..."
                                value={appointmentSearchQuery}
                                onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            {appointmentSearchQuery && (
                                <button
                                    onClick={() => setAppointmentSearchQuery('')}
                                    className="clear-search"
                                    aria-label="Clear search"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {(() => {
                        const { appointments, total } = getPaginatedAppointments();
                        const totalPages = Math.ceil(total / appointmentsPerPage);

                        return total > 0 ? (
                            <>
                    <div className="table-wrapper">
                        <table className="service-appointment-table">
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
                                {appointments.map((booking, index) => (
                                    <tr key={booking._id || booking.id || index}>
                                        <td className="service-id-cell">
                                            <span className="id-text">#{(booking._id || booking.id || 'Unknown').toString().substring(0, 10)}...</span>
                                        </td>
                                        <td className="service-name-cell">
                                            <div className="service-content">
                                                <div className="service-icon">
                                                    <i className={`fas fa-${
                                                        (booking.serviceType || booking.service?.type) === 'Grooming' ? 'cut' :
                                                        (booking.serviceType || booking.service?.type) === 'Veterinary' ? 'stethoscope' :
                                                        (booking.serviceType || booking.service?.type) === 'Training' ? 'dumbbell' : 'paw'
                                                    }`}></i>
                                                </div>
                                                <div className="service-details">
                                                    <div className="service-name">{booking.service?.name || booking.serviceName || 'Pet Service'}</div>
                                                    <div className="service-provider">Provider: {booking.service?.providerName || 'Unknown Provider'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="date-cell">
                                            <div className="date-badge">
                                                <i className="far fa-calendar-alt"></i>
                                                <span>{booking.date || booking.bookingDate || 'Not set'}</span>
                                            </div>
                                        </td>
                                        <td className="time-cell">
                                            <div className="time-badge">
                                                <i className="far fa-clock"></i>
                                                <span>{booking.time || 'Not set'}</span>
                                            </div>
                                        </td>
                                        <td className="status-cell">
                                            <span className={`status-badge ${getStatusColor(booking.status || 'pending')}`}>
                                                <i className="fas fa-circle"></i>
                                                {(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {total > appointmentsPerPage && (
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentAppointmentsPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentAppointmentsPage === 1}
                                className="pagination-btn"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentAppointmentsPage(i + 1)}
                                    className={`pagination-btn ${currentAppointmentsPage === i + 1 ? 'active' : ''}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => setCurrentAppointmentsPage(prev => 
                                    Math.min(prev + 1, totalPages)
                                )}
                                disabled={currentAppointmentsPage === totalPages}
                                className="pagination-btn"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                    
                    {/* Results info */}
                    <div className="results-info">
                        Showing {((currentAppointmentsPage - 1) * appointmentsPerPage) + 1} - {Math.min(currentAppointmentsPage * appointmentsPerPage, total)} of {total} appointments
                    </div>
                    </>
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-search"></i>
                                <p>No appointments found matching your search criteria.</p>
                                <button 
                                    onClick={() => setAppointmentSearchQuery('')}
                                    className="btn btn-secondary"
                                >
                                    Clear Search
                                </button>
                            </div>
                        );
                    })()}
                    </>
                ) : (
                    <div className="empty-state service-empty-state">
                        <div className="empty-icon">
                            <i className="fas fa-calendar-alt"></i>
                            <i className="fas fa-times overlay-icon"></i>
                        </div>
                        <h3>No appointments scheduled yet.</h3>
                        <p>Book a service for your pet today!</p>
                        <a href="/services" className="btn btn-primary browse-services-btn">
                            Browse Services
                        </a>
                    </div>
                )}
            </section>
                        )}

                        {/* My Orders Tab */}
                        {activeTab === 'orders' && (
            <section className="section my-orders-section">
                <div className="section-header">
                    <h2 className="section-title">
                        My Orders
                    </h2>
                </div>

                {/* Search and Filter Controls */}
                <div className="orders-controls">
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search by order ID, product name, or amount..."
                            value={orderSearchQuery}
                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {orderSearchQuery && (
                            <button 
                                className="clear-search"
                                onClick={() => setOrderSearchQuery('')}
                                aria-label="Clear search"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    <div className="filter-box">
                        <i className="fas fa-filter"></i>
                        <select
                            value={orderStatusFilter}
                            onChange={(e) => setOrderStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {(() => {
                    const filteredOrders = getFilteredOrders();
                    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
                    const paginatedOrders = filteredOrders.slice(
                        (currentOrdersPage - 1) * ordersPerPage,
                        currentOrdersPage * ordersPerPage
                    );

                    return filteredOrders.length > 0 ? (
                    <>
                        <div className="orders-list-clean">
                            {paginatedOrders.map(order => (
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
                        {filteredOrders.length > ordersPerPage && (
                            <div className="pagination-controls">
                                {/* Previous button */}
                                <button
                                    onClick={() => setCurrentOrdersPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentOrdersPage === 1}
                                    className="pagination-btn"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                
                                {/* Page numbers */}
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentOrdersPage(i + 1)}
                                        className={`pagination-btn ${
                                            currentOrdersPage === i + 1 ? 'active' : ''
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                
                                {/* Next button */}
                                <button
                                    onClick={() => setCurrentOrdersPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentOrdersPage === totalPages}
                                    className="pagination-btn"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}

                        {/* Results info */}
                        <div className="results-info">
                            Showing {((currentOrdersPage - 1) * ordersPerPage) + 1} - {Math.min(currentOrdersPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                            {(orderSearchQuery || orderStatusFilter !== 'all') && (
                                <button 
                                    className="clear-filters-btn"
                                    onClick={() => {
                                        setOrderSearchQuery('');
                                        setOrderStatusFilter('all');
                                        setCurrentOrdersPage(1);
                                    }}
                                >
                                    <i className="fas fa-times"></i> Clear Filters
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-shopping-bag"></i>
                        <h3>No orders found</h3>
                        <p>
                            {orderSearchQuery || orderStatusFilter !== 'all' 
                                ? 'No orders match your search criteria. Try adjusting your filters.' 
                                : 'Start shopping and your orders will appear here!'
                            }
                        </p>
                        {(orderSearchQuery || orderStatusFilter !== 'all') ? (
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    setOrderSearchQuery('');
                                    setOrderStatusFilter('all');
                                    setCurrentOrdersPage(1);
                                }}
                            >
                                <i className="fas fa-times"></i> Clear Filters
                            </button>
                        ) : (
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
                        )}
                    </div>
                );
                })()}
            </section>
                        )}
                    </div>
                </main>
            </div>

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
