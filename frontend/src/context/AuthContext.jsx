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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    const checkSession = useCallback(async () => {
        // Prevent multiple simultaneous session checks
        if (initialized) return;
        
        try {
            console.log('Checking user session...');
            const response = await checkUserSession();
            console.log('Session check response:', response.data);
            
            if (response.data.success && response.data.user) {
                console.log('User authenticated:', response.data.user);
                setUser(response.data.user);
            } else if (response.data.isLoggedIn) {
                console.log('User logged in:', response.data.user);
                setUser(response.data.user);
            } else {
                console.log('User not authenticated');
                setUser(null);
            }
        } catch (error) {
            console.error('Session check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }, [initialized]);

    useEffect(() => {
        if (!initialized) {
            checkSession();
        }
    }, [checkSession, initialized]);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await logoutAPI();
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        logout,
        checkSession,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSeller: user?.role === 'seller',
        isServiceProvider: user?.role === 'service-provider',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
