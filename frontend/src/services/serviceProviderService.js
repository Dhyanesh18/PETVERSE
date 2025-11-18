import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ===== Service Provider Dashboard APIs =====
export const getServiceProviderDashboard = () => apiClient.get('/api/service-provider/dashboard');

export const getBookings = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/service-provider/bookings${queryString ? `?${queryString}` : ''}`);
};

export const getBookingById = (bookingId) => apiClient.get(`/api/service-provider/bookings/${bookingId}`);

export const updateBookingStatus = (bookingId, status) => 
    apiClient.patch(`/api/service-provider/bookings/${bookingId}/status`, { status });

export const cancelBooking = (bookingId) => 
    apiClient.post(`/api/service-provider/bookings/${bookingId}/cancel`);

export const getReviews = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/service-provider/reviews${queryString ? `?${queryString}` : ''}`);
};

export const replyToReview = (reviewId, reply) => 
    apiClient.post(`/api/service-provider/reviews/${reviewId}/reply`, { reply });

export const getWalletBalance = () => apiClient.get('/api/service-provider/wallet');

export const getAvailability = () => apiClient.get('/api/service-provider/availability');

export const updateAvailability = (availabilityData) => 
    apiClient.post('/api/service-provider/availability', availabilityData);

export default {
    getServiceProviderDashboard,
    getBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    getReviews,
    replyToReview,
    getWalletBalance,
    getAvailability,
    updateAvailability
};
