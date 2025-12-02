import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAdminDashboard } from '../../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance with credentials
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// API functions
export const approveApplication = (id, type) => {
    return apiClient.post(`/admin/approve/${type}/${id}`);
};

export const rejectApplication = (id, type, reason) => {
    return apiClient.post(`/admin/reject/${type}/${id}`, { reason });
};

export const approveUser = (userId) => {
    return apiClient.post(`/admin/approve-user/${userId}`);
};

export const deleteUser = (userId) => {
    return apiClient.delete(`/admin/user/${userId}`);
};

export const deleteProduct = (productId) => {
    return apiClient.delete(`/admin/product/${productId}`);
};

export const deleteService = (serviceId) => {
    return apiClient.delete(`/admin/service/${serviceId}`);
};

export const deletePet = (petId) => {
    return apiClient.delete(`/admin/pet/${petId}`);
};

export const updateOrderStatus = (orderId, status) => {
    return apiClient.put(`/admin/order/${orderId}/status`, { status });
};

// Async thunks
export const fetchAdminDashboard = createAsyncThunk(
    'admin/fetchDashboard',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching admin dashboard from API...');
            const response = await getAdminDashboard();
            console.log('Admin dashboard API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Admin dashboard fetch error:', error);
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch dashboard data' });
        }
    }
);

export const approveItem = createAsyncThunk(
    'admin/approveItem',
    async ({ id, type }, { rejectWithValue }) => {
        try {
            const response = await approveApplication(id, type);
            return { ...response.data, id, type };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to approve item' });
        }
    }
);

export const rejectItem = createAsyncThunk(
    'admin/rejectItem',
    async ({ id, type, reason }, { rejectWithValue }) => {
        try {
            const response = await rejectApplication(id, type, reason);
            return { ...response.data, id, type };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to reject item' });
        }
    }
);

// Slice
const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        dashboardData: null,
        loading: false,
        error: null,
        activeTab: 'dashboard'
    },
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminDashboard.pending, (state) => {
                console.log('Admin dashboard fetch pending...');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
                console.log('Admin dashboard fetch fulfilled:', action.payload);
                state.loading = false;
                state.dashboardData = action.payload;
                state.error = null;
            })
            .addCase(fetchAdminDashboard.rejected, (state, action) => {
                console.error('Admin dashboard fetch rejected:', action.payload);
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load dashboard';
            })
            .addCase(approveItem.fulfilled, () => {
                // Trigger a refresh by setting a flag or refetch
            })
            .addCase(rejectItem.fulfilled, () => {
                // Trigger a refresh by setting a flag or refetch
            });
    }
});

export const { setActiveTab, clearError } = adminSlice.actions;
export default adminSlice.reducer;
