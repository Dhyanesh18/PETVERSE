import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// ===== Interceptors =====
apiClient.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            console.error(`API Error (${error.response.status}):`, error.response.data);
            
            switch (error.response.status) {
                case 400:
                    console.error('Bad Request:', error.response.data?.message || 'Invalid data');
                    break;
                case 401:
                    console.error('Unauthorized. Please login.');
                    break;
                case 403:
                    console.error('Forbidden. Access denied.');
                    break;
                case 404:
                    console.error('Resource not found.');
                    break;
                case 500:
                    console.error('Server error. Please try again later.');
                    break;
            }
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network error. Please check your connection.');
        } else {
            // Something else happened
            console.error('An error occurred:', error.message);
        }
        return Promise.reject(error);
    }
);

// ===== Auth APIs =====
export const login = (credentials) => apiClient.post('/api/auth/login', credentials);
export const signup = (userData) => apiClient.post('/api/auth/register', userData);
export const signupOwner = (userData) => apiClient.post('/api/auth/signup/owner', userData);
export const signupSeller = (formData) => apiClient.post('/api/auth/signup/seller', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const signupServiceProvider = (formData) => apiClient.post('/api/auth/signup/service-provider', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const logout = () => apiClient.post('/api/auth/logout');
export const checkUserSession = () => apiClient.get('/api/auth/check-session');

// ===== OTP APIs =====
export const requestLoginOTP = (credentials) => apiClient.post('/api/otp/request-login-otp', credentials);
export const verifyLoginOTP = (data) => apiClient.post('/api/otp/verify-login-otp', data);
export const resendOTP = (data) => apiClient.post('/api/otp/resend-otp', data);

// ===== Search APIs =====
export const searchAll = (query) => apiClient.get(`/api/search?q=${encodeURIComponent(query)}`);
export const searchByType = (query, type) => apiClient.get(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);

// ===== Pet APIs =====
export const getPets = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/pets${queryString ? `?${queryString}` : ''}`);
};
export const getPetById = (id) => apiClient.get(`/api/pets/${id}`);
export const addPet = (petData) => apiClient.post('/api/pets', petData);
export const updatePet = (id, petData) => apiClient.put(`/api/pets/${id}`, petData);

export const getFeaturedPets = () => apiClient.get('/api/featured-pets');

// ===== Product APIs =====
export const getProducts = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/products${queryString ? `?${queryString}` : ''}`);
};
export const getProductById = (id) => apiClient.get(`/api/products/${id}`);
export const addProduct = (productData) => apiClient.post('/api/products', productData);
export const updateProduct = (id, productData) => apiClient.put(`/api/products/${id}`, productData);

export const getFeaturedProducts = () => apiClient.get('/api/featured-products');

// ===== Service APIs =====
export const getServices = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/services${queryString ? `?${queryString}` : ''}`);
};
export const getServiceById = (id) => apiClient.get(`/api/services/${id}`);
export const getAvailableSlots = (serviceId, date) => 
    apiClient.get(`/api/booking/available/slots?serviceId=${serviceId}&date=${date}`);

// ===== User APIs =====
export const getUserStats = () => apiClient.get('/api/user/stats');
export const getUserDashboard = () => apiClient.get('/api/user/dashboard');
export const getSellerDashboard = () => apiClient.get('/api/seller/dashboard');
export const updateSellerOrderStatus = (orderId, status) => apiClient.patch(`/api/seller/orders/${orderId}/status`, { status });

// ===== Wishlist APIs =====
export const getWishlist = () => apiClient.get('/api/wishlist');
export const togglePetWishlist = (petId) => apiClient.post(`/api/wishlist/pet/${petId}/toggle`);
export const toggleProductWishlist = (productId) => apiClient.post(`/api/wishlist/product/${productId}/toggle`);
export const getWishlistStatus = (type, id) => apiClient.get(`/api/wishlist/status/${type}/${id}`);

// ===== Event APIs =====
export const getEvents = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/events${queryString ? `?${queryString}` : ''}`);
};
export const getEventById = (id) => apiClient.get(`/api/events/${id}`);
export const addEvent = (eventData) =>
    apiClient.post('/api/events/add', eventData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
export const registerForEvent = (registrationData) => apiClient.post('/api/events/register', registrationData);
export const unregisterFromEvent = (eventId) => apiClient.delete(`/api/events/${eventId}/unregister`);
export const getEventPaymentData = (eventId) => apiClient.get(`/api/events/${eventId}/payment`);
export const processEventPayment = (eventId, paymentData) => apiClient.post(`/api/events/${eventId}/pay`, paymentData);
export const getEventTicket = (eventId) => apiClient.get(`/api/events/${eventId}/ticket`);
export const getMyRegisteredEvents = () => apiClient.get('/api/events/my/registered');
export const getMyOrganizedEvents = () => apiClient.get('/api/events/my/organized');
export const getRegisteredEvents = () => apiClient.get('/api/events/registered');

// ===== Booking APIs =====
export const getBookings = () => apiClient.get('/api/booking/user/my-bookings');
export const createBooking = (bookingData) => apiClient.post('/api/booking/create', bookingData);
export const getBookingDetails = (bookingId) => apiClient.get(`/api/booking/details/${bookingId}`);

// ===== Order & Checkout APIs =====
export const getOrders = () => apiClient.get('/api/orders');
export const getOrderById = (id) => apiClient.get(`/api/orders/${id}`);

// ===== Cart APIs =====
export const getCart = () => apiClient.get('/api/cart');
export const addToCart = (itemData) => apiClient.post('/api/cart/add', itemData);
export const updateCartItem = (productId, quantity, itemType) => 
    apiClient.patch('/api/cart/update', { productId, quantity, itemType });
export const removeFromCart = (itemId, itemType) => apiClient.delete(`/api/cart/remove/${itemId}`, { data: { itemType } });
export const clearCart = () => apiClient.delete('/api/cart/clear');

// ===== Checkout APIs =====
export const getCheckoutData = () => apiClient.get('/api/payment/checkout');
export const submitCheckout = (shippingData) => apiClient.post('/api/payment/checkout', shippingData);
export const submitCheckoutForm = (formData) => apiClient.post('/api/payment/checkout', formData);
export const prepareCheckout = () => apiClient.post('/checkout/prepare');
export const processPayment = (paymentData) => apiClient.post('/api/payment', paymentData);
export const getWalletBalance = () => apiClient.get('/api/wallet');

// ===== Review APIs =====
export const getReviews = (type, itemId) => apiClient.get(`/api/reviews/${type}/${itemId}`);
export const getUserReview = (type, itemId) => apiClient.get(`/api/reviews/user/${type}/${itemId}`);
export const addReview = (reviewData) => apiClient.post('/api/reviews', reviewData);
export const deleteReview = (reviewId) => apiClient.delete(`/api/reviews/${reviewId}`);
export const canUserReview = (type, itemId) => apiClient.get(`/api/reviews/can-review/${type}/${itemId}`);

// ===== Admin APIs =====
export const getAdminDashboard = () => apiClient.get('/api/admin/dashboard');
export const approveApplication = (id, type) => apiClient.post(`/api/admin/approve/${type}/${id}`);
export const rejectApplication = (id, type, reason) => apiClient.post(`/api/admin/reject/${type}/${id}`, { reason });
export const approveUser = (userId) => apiClient.post(`/api/admin/approve-user/${userId}`);
export const deleteUser = (userId) => apiClient.delete(`/api/admin/user/${userId}`);
export const deleteProduct = (productId) => apiClient.delete(`/api/admin/product/${productId}`);
export const deleteService = (serviceId) => apiClient.delete(`/api/admin/service/${serviceId}`);
export const deletePet = (petId) => apiClient.delete(`/api/admin/pet/${petId}`);
export const updateOrderStatus = (orderId, status) => apiClient.patch(`/api/admin/order/${orderId}/status`, { status });

export default apiClient;