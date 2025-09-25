import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    withCredentails: true,
});

export const getFeaturedPets = () => apiClient.get('/featured-pets');
export const getFeaturedProducts = () => apiClient.get('/featured-products');
export const checkUserSession = () => apiClient.get('/check-session');