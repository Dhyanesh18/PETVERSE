import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true, // Important for sending cookies/sessions
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor (optional - for debugging)
api.interceptors.request.use(
    (config) => {
        // You can add auth tokens here if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional - for error handling)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            // Server responded with error status
            switch (error.response.status) {
                case 401:
                    // Unauthorized - redirect to login
                    console.error('Unauthorized. Please login.');
                    // window.location.href = '/login';
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
                default:
                    console.error('An error occurred:', error.response.data.error);
            }
        } else if (error.request) {
            // Request made but no response
            console.error('Network error. Please check your connection.');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;