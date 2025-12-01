import { useSelector, useDispatch } from 'react-redux';
import {
    selectUser,
    selectLoading,
    selectIsAuthenticated,
    selectIsAdmin,
    selectIsSeller,
    selectIsServiceProvider,
    selectIsOwner,
    login as loginAction,
    logout as logoutAction,
    setUser as setUserAction,
    checkSession as checkSessionAction,
    resetInitialized,
} from '../redux/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const loading = useSelector(selectLoading);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isAdmin = useSelector(selectIsAdmin);
    const isSeller = useSelector(selectIsSeller);
    const isServiceProvider = useSelector(selectIsServiceProvider);
    const isOwner = useSelector(selectIsOwner);

    const login = (userData) => {
        dispatch(loginAction(userData));
    };

    const logout = () => {
        dispatch(logoutAction());
    };

    const setUser = (userData) => {
        dispatch(setUserAction(userData));
    };

    const checkSession = () => {
        dispatch(checkSessionAction());
    };

    const refreshSession = () => {
        dispatch(resetInitialized());
        dispatch(checkSessionAction());
    };

    return {
        user,
        setUser,
        loading,
        login,
        logout,
        checkSession,
        refreshSession,
        isAuthenticated,
        isAdmin,
        isSeller,
        isServiceProvider,
        isOwner,
    };
};
