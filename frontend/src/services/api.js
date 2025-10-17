import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
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
export const checkUserSession = () => apiClient.get('/api/check-session');

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
export const getServices = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/services${queryString ? `?${queryString}` : ''}`);
};
export const getServiceById = (id) => apiClient.get(`/api/services/${id}`);
export const bookService = (bookingData) => apiClient.post('/booking/create', bookingData);

// Cart APIs
export const getCart = () => apiClient.get('/api/cart');
export const addToCart = (itemData) => apiClient.post('/api/cart/add', itemData);
export const removeFromCart = (itemId) => apiClient.delete(`/api/cart/remove/${itemId}`);
export const clearCart = () => apiClient.delete('/api/cart/clear');

// Event APIs
export const getEvents = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/events${queryString ? `?${queryString}` : ''}`);
};
export const getEventById = (id) => apiClient.get(`/api/events/${id}`);
export const registerForEvent = (eventId, registrationData) => apiClient.post(`/events/${eventId}/register`, registrationData);

// Order APIs
export const createOrder = (orderData) => apiClient.post('/api/payment', orderData);
export const getOrders = () => apiClient.get('/api/orders');
export const getOrderById = (id) => apiClient.get(`/api/orders/${id}`);

// Checkout APIs
export const submitCheckout = (shippingData) => apiClient.post('/api/checkout', shippingData);
export const processPayment = (paymentData) => apiClient.post('/api/payment', paymentData);
export const getWalletBalance = () => apiClient.get('/api/wallet');

// Dashboard APIs
export const getOwnerDashboard = () => apiClient.get('/owner-dashboard');
export const getSellerDashboard = () => apiClient.get('/seller/dashboard');
export const getServiceProviderDashboard = () => apiClient.get('/service-provider/dashboard');
export const getAdminDashboard = () => apiClient.get('/admin/dashboard');

// Review APIs
export const addReview = (productId, reviewData) => apiClient.post(`/review/${productId}`, reviewData);
export const getReviews = (productId) => apiClient.get(`/review/${productId}`);

// Mate APIs
export const getMateListings = () => apiClient.get('/api/mate/api/filter');
export const addMateRequest = (mateData) => apiClient.post('/api/mate/add', mateData);

// User APIs
export const getUserProfile = () => apiClient.get('/api/user/profile');
export const updateUserProfile = (userData) => apiClient.put('/api/user/profile', userData);

export default apiClient;