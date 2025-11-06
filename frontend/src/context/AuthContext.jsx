import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkUserSession, logout as logoutAPI } from '../services/api';

const AuthContext = createContext();
export { AuthContext };
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Try to get user from localStorage on initialization
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error('Error parsing saved user:', error);
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const checkSession = useCallback(async () => {
        // Prevent multiple simultaneous session checks
        if (initialized || isChecking) return;
        
        setIsChecking(true);
        try {
            const response = await checkUserSession();
            console.log('Session check response:', response.data);
            
            // Check if user is logged in and has user data
            if (response.data.success && response.data.isLoggedIn && response.data.user) {
                console.log('User authenticated successfully:', response.data.user);
                setUser(response.data.user);
                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } else if (response.data.isLoggedIn && response.data.user) {
                setUser(response.data.user);
                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
                console.log('User not authenticated');
                setUser(null);
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Session check failed:', error);
            console.log('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            setUser(null);
        } finally {
            setLoading(false);
            setInitialized(true);
            setIsChecking(false);
        }
    }, [initialized, isChecking]);

    useEffect(() => {
        if (!initialized) {
            checkSession();
        }
    }, [checkSession, initialized]);

    const login = (userData) => {
        setUser(userData);
        // Save to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        setInitialized(true);
    };

    const logout = async () => {
        try {
            await logoutAPI();
            setUser(null);
            localStorage.removeItem('user');
            setInitialized(false);
        } catch (error) {
            console.error('Logout failed:', error);
            setUser(null);
            localStorage.removeItem('user');
        }
    };

    const refreshSession = async () => {
        setInitialized(false);
        setIsChecking(false);
        setLoading(true);
        await checkSession();
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        logout,
        checkSession,
        refreshSession,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSeller: user?.role === 'seller',
        isServiceProvider: user?.role === 'service-provider',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
