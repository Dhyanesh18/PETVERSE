import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // No need to re-check session on every navigation - auth state is managed by Redux
    // Session is already checked on app initialization in AppInitializer

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has required role (if specified)
    if (allowedRoles.length > 0) {
        const userRole = user?.role;
        
        // If user role is not in allowed roles, redirect to unauthorized
        if (!userRole || !allowedRoles.includes(userRole)) {
            console.warn('ProtectedRoute: Access denied - Role mismatch', {
                userRole: userRole || 'undefined',
                allowedRoles,
                path: location.pathname,
                message: `User with role '${userRole || 'undefined'}' cannot access route requiring roles: ${allowedRoles.join(', ')}`
            });
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;