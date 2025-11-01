import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/check-session');
            if (response.data.success && response.data.isLoggedIn) {
                setIsAuthenticated(true);
                setUserRole(response.data.userRole);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login while saving the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has required role (if specified)
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;