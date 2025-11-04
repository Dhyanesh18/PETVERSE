import { createContext, useContext, useState, useEffect } from 'react';
import { checkUserSession, logout as logoutAPI } from '../services/api';

const AuthContext = createContext();
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

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await checkUserSession();
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
            } else if (response.data.isLoggedIn) {
                setUser(response.data.user);
            }
        } catch (error) {
            console.error('Session check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

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
        loading,
        login,
        logout,
        checkSession,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSeller: user?.role === 'seller',
        isServiceProvider: user?.role === 'service_provider',
        isOwner: user?.role === 'owner',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
