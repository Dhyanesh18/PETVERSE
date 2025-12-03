import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true
});

// Async thunk for fetching seller dashboard data
export const fetchSellerDashboard = createAsyncThunk(
    'seller/fetchDashboard',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/seller/dashboard');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch seller dashboard' });
        }
    }
);

// Async thunk for updating order status
export const updateOrderStatus = createAsyncThunk(
    'seller/updateOrderStatus',
    async ({ orderId, status }, { rejectWithValue }) => {
        try {
            const response = await apiClient.patch(`/seller/orders/${orderId}/status`, { status });
            return { orderId, status, data: response.data.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update order status' });
        }
    }
);

const sellerSlice = createSlice({
    name: 'seller',
    initialState: {
        seller: {},
        statistics: {
            totalProducts: 0,
            totalPets: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            walletBalance: 0,
            averageRating: 0
        },
        orders: [],
        reviews: [],
        loading: false,
        error: null
    },
    reducers: {
        clearSellerData: (state) => {
            state.seller = {};
            state.statistics = {
                totalProducts: 0,
                totalPets: 0,
                totalRevenue: 0,
                pendingOrders: 0,
                walletBalance: 0,
                averageRating: 0
            };
            state.orders = [];
            state.reviews = [];
            state.error = null;
        },
        updateLocalOrderStatus: (state, action) => {
            const { orderId, status } = action.payload;
            const order = state.orders.find(o => o._id === orderId);
            if (order) {
                order.status = status;
            }
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch seller dashboard
            .addCase(fetchSellerDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSellerDashboard.fulfilled, (state, action) => {
                state.loading = false;
                const { seller, statistics, recentOrders, reviews } = action.payload;
                
                state.seller = seller || {};
                state.statistics = {
                    totalProducts: statistics?.totalProducts || 0,
                    totalPets: statistics?.totalPets || 0,
                    totalRevenue: parseFloat(statistics?.totalRevenue || 0),
                    pendingOrders: statistics?.pendingOrders || 0,
                    walletBalance: parseFloat(statistics?.walletBalance || seller?.wallet?.balance || 0),
                    averageRating: parseFloat(statistics?.averageRating || 0)
                };
                state.orders = recentOrders || [];
                state.reviews = reviews || [];
            })
            .addCase(fetchSellerDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load seller dashboard';
            })
            
            // Update order status
            .addCase(updateOrderStatus.pending, (state) => {
                state.error = null;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                const { orderId, status } = action.payload;
                const order = state.orders.find(o => o._id === orderId);
                if (order) {
                    order.status = status;
                }
                // Decrement pending orders count if status changed from pending
                if (status !== 'pending' && order?.status === 'pending') {
                    state.statistics.pendingOrders = Math.max(0, state.statistics.pendingOrders - 1);
                }
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.error = action.payload?.message || 'Failed to update order status';
            });
    }
});

export const { clearSellerData, updateLocalOrderStatus, clearError } = sellerSlice.actions;

export default sellerSlice.reducer;
