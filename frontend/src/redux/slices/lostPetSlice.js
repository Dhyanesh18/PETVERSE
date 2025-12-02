import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: `${API_URL}/api/lost-pets`,
    withCredentials: true
});

// Async thunks
export const fetchLostPets = createAsyncThunk(
    'lostPet/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/', { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch lost pets' });
        }
    }
);

export const fetchLostPetById = createAsyncThunk(
    'lostPet/fetchById',
    async ({ id, latitude, longitude }, { rejectWithValue }) => {
        try {
            const params = latitude && longitude ? { latitude, longitude } : {};
            const response = await apiClient.get(`/${id}`, { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch lost pet' });
        }
    }
);

export const createLostPet = createAsyncThunk(
    'lostPet/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to create post' });
        }
    }
);

export const updateLostPetStatus = createAsyncThunk(
    'lostPet/updateStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const response = await apiClient.patch(`/${id}/status`, { status });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update status' });
        }
    }
);

export const addComment = createAsyncThunk(
    'lostPet/addComment',
    async ({ id, message }, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(`/${id}/comment`, { message });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to add comment' });
        }
    }
);

const lostPetSlice = createSlice({
    name: 'lostPet',
    initialState: {
        lostPets: [],
        selectedLostPet: null,
        userLocation: null,
        loading: false,
        error: null,
        pagination: {
            page: 1,
            limit: 12,
            total: 0
        }
    },
    reducers: {
        setUserLocation: (state, action) => {
            state.userLocation = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedLostPet: (state) => {
            state.selectedLostPet = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLostPets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLostPets.fulfilled, (state, action) => {
                state.loading = false;
                state.lostPets = action.payload.lostPets;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchLostPets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load lost pets';
            })
            .addCase(fetchLostPetById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLostPetById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedLostPet = action.payload;
            })
            .addCase(fetchLostPetById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load lost pet details';
            })
            .addCase(createLostPet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLostPet.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createLostPet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to create post';
            });
    }
});

export const { setUserLocation, clearError, clearSelectedLostPet } = lostPetSlice.actions;
export default lostPetSlice.reducer;
