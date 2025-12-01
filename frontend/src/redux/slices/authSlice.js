import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { checkUserSession, logout as logoutAPI } from '../../services/api';

// Helper to get user from localStorage
const getUserFromLocalStorage = () => {
    try {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        console.error('Error parsing saved user:', error);
        return null;
    }
};

// Async thunks
export const checkSession = createAsyncThunk(
    'auth/checkSession',
    async (_, { rejectWithValue }) => {
        try {
            const response = await checkUserSession();
            console.log('Session check response:', response.data);
            
            if (response.data.success && response.data.isLoggedIn && response.data.user) {
                console.log('User authenticated successfully:', response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data.user;
            } else if (response.data.isLoggedIn && response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data.user;
            } else {
                console.log('User not authenticated');
                localStorage.removeItem('user');
                return null;
            }
        } catch (error) {
            console.error('Session check failed:', error);
            console.log('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            localStorage.removeItem('user');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await logoutAPI();
            localStorage.removeItem('user');
            return null;
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.removeItem('user');
            return rejectWithValue(error.response?.data);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: getUserFromLocalStorage(),
        loading: true,
        initialized: false,
        isChecking: false,
        error: null,
    },
    reducers: {
        login: (state, action) => {
            state.user = action.payload;
            state.initialized = true;
            state.error = null;
            localStorage.setItem('user', JSON.stringify(action.payload));
        },
        setUser: (state, action) => {
            state.user = action.payload;
            if (action.payload) {
                localStorage.setItem('user', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('user');
            }
        },
        resetInitialized: (state) => {
            state.initialized = false;
            state.isChecking = false;
            state.loading = true;
        },
    },
    extraReducers: (builder) => {
        builder
            // Check session
            .addCase(checkSession.pending, (state) => {
                state.isChecking = true;
                state.loading = true;
            })
            .addCase(checkSession.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
                state.initialized = true;
                state.isChecking = false;
                state.error = null;
            })
            .addCase(checkSession.rejected, (state, action) => {
                state.user = null;
                state.loading = false;
                state.initialized = true;
                state.isChecking = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
                state.initialized = false;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.user = null;
                state.loading = false;
                state.initialized = false;
                state.error = action.payload;
            });
    },
});

export const { login, setUser, resetInitialized } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectLoading = (state) => state.auth.loading;
export const selectInitialized = (state) => state.auth.initialized;
export const selectIsChecking = (state) => state.auth.isChecking;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsSeller = (state) => state.auth.user?.role === 'seller';
export const selectIsServiceProvider = (state) => state.auth.user?.role === 'service_provider';
export const selectIsOwner = (state) => state.auth.user?.role === 'owner';

export default authSlice.reducer;
