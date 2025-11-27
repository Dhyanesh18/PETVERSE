import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

apiClient.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const login = (credentials) => apiClient.post('/api/auth/login', credentials);
export const signup = (userData) => apiClient.post('/api/auth/register', userData);
export const logout = () => apiClient.post('/api/auth/logout');
export const checkUserSession = () => apiClient.get('/api/auth/check-session');

// Search APIs
export const searchAll = (query) => apiClient.get(`/api/search?q=${encodeURIComponent(query)}`);
export const searchByType = (query, type) => apiClient.get(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);

// Pet APIs
export const getPets = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/pets${queryString ? `?${queryString}` : ''}`);
};
export const getPetById = (id) => apiClient.get(`/api/pets/${id}`);
export const addPet = (petData) => apiClient.post('/api/pets/add', petData);
export const updatePet = (id, petData) => apiClient.post(`/api/pets/${id}/edit`, petData);
export const deletePet = (id) => apiClient.delete(`/api/pets/${id}`);
export const getFeaturedPets = () => apiClient.get('/api/featured-pets');

// Product APIs
export const getProducts = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/products${queryString ? `?${queryString}` : ''}`);
};
export const getProductById = (id) => apiClient.get(`/api/products/${id}`);
export const addProduct = (productData) => apiClient.post('/api/products/add', productData);
export const updateProduct = (id, productData) => apiClient.post(`/api/products/${id}/edit`, productData);
export const deleteProduct = (id) => apiClient.delete(`/api/products/${id}`);
export const getFeaturedProducts = () => apiClient.get('/api/featured-products');

// Service APIs
export const getServices = () => apiClient.get('/api/services');
export const getServiceById = (id) => apiClient.get(`/api/services/${id}`);

// User Stats APIs
export const getUserStats = () => apiClient.get('/api/user/stats');
export const getUserDashboard = () => apiClient.get('/api/user/dashboard');
export const getSellerDashboard = () => apiClient.get('/api/seller/dashboard');

// Wishlist APIs
export const getWishlist = () => apiClient.get('/api/wishlist');
export const togglePetWishlist = (petId) => apiClient.post(`/api/wishlist/pet/${petId}/toggle`);
export const toggleProductWishlist = (productId) => apiClient.post(`/api/wishlist/product/${productId}/toggle`);
export const getWishlistStatus = (type, id) => apiClient.get(`/api/wishlist/status/${type}/${id}`);

// Events APIs
export const getEvents = () => apiClient.get('/api/events');
export const getEventById = (id) => apiClient.get(`/api/events/${id}`);
export const getRegisteredEvents = () => apiClient.get('/api/events/registered');
export const registerForEvent = (eventId) => apiClient.post(`/api/events/${eventId}/register`);

// Booking APIs
export const getBookings = () => apiClient.get('/api/bookings');
export const createBooking = (bookingData) => apiClient.post('/api/bookings', bookingData);

// Order APIs
export const getOrders = () => apiClient.get('/api/orders');
export const getOrderById = (id) => apiClient.get(`/api/orders/${id}`);

// Cart APIs
export const getCart = () => apiClient.get('/api/cart');
export const addToCart = (itemData) => apiClient.post('/api/cart/add', itemData);
export const updateCartItem = (productId, quantity, itemType) => 
    apiClient.patch('/api/cart/update', { productId, quantity, itemType });
export const removeFromCart = (itemId, itemType) => apiClient.delete(`/api/cart/remove/${itemId}`, { data: { itemType } });
export const clearCart = () => apiClient.delete('/api/cart/clear');

// Checkout APIs
export const getCheckoutData = () => apiClient.get('/api/payment/checkout');
export const submitCheckout = (shippingData) => apiClient.post('/api/payment/checkout', shippingData);
export const submitCheckoutForm = (formData) => apiClient.post('/api/payment/checkout', formData);
export const prepareCheckout = () => apiClient.post('/checkout/prepare');
export const processPayment = (paymentData) => apiClient.post('/api/payment', paymentData);
export const getWalletBalance = () => apiClient.get('/api/wallet');

// Review APIs
export const getReviews = (type, itemId) => apiClient.get(`/api/reviews/${type}/${itemId}`);
export const getUserReview = (type, itemId) => apiClient.get(`/api/reviews/user/${type}/${itemId}`);
export const addReview = (reviewData) => apiClient.post('/api/reviews', reviewData);
export const deleteReview = (reviewId) => apiClient.delete(`/api/reviews/${reviewId}`);
export const canUserReview = (type, itemId) => apiClient.get(`/api/reviews/can-review/${type}/${itemId}`);

export default apiClient;