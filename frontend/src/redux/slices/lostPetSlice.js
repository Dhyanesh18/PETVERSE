import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch all lost pets
export const fetchLostPets = createAsyncThunk(
    'lostPet/fetchAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.petType) queryParams.append('petType', params.petType);
            if (params.latitude) queryParams.append('latitude', params.latitude);
            if (params.longitude) queryParams.append('longitude', params.longitude);
            if (params.radius) queryParams.append('radius', params.radius);
            
            const response = await api.get(`/lost-pets?${queryParams.toString()}`);
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch lost pets');
        }
    }
);

// Fetch single lost pet by ID
export const fetchLostPetById = createAsyncThunk(
    'lostPet/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/lost-pets/${id}`);
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch pet details');
        }
    }
);

// Create new lost pet post
export const createLostPet = createAsyncThunk(
    'lostPet/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/lost-pets/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create post');
        }
    }
);

// Add comment to lost pet post
export const addComment = createAsyncThunk(
    'lostPet/addComment',
    async ({ id, message }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/lost-pets/${id}/comment`, { message });
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to add comment');
        }
    }
);

// Update lost pet status
export const updateStatus = createAsyncThunk(
    'lostPet/updateStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/lost-pets/${id}/status`, { status });
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update status');
        }
    }
);

const lostPetSlice = createSlice({
    name: 'lostPet',
    initialState: {
        lostPets: [],
        currentLostPet: null,
        loading: false,
        error: null,
        userLocation: null,
        pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            total: 0
        }
    },
    reducers: {
        setUserLocation: (state, action) => {
            state.userLocation = action.payload;
        },
        clearCurrentLostPet: (state) => {
            state.currentLostPet = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all lost pets
            .addCase(fetchLostPets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLostPets.fulfilled, (state, action) => {
                state.loading = false;
                state.lostPets = action.payload.lostPets || action.payload;
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchLostPets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch single lost pet
            .addCase(fetchLostPetById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLostPetById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentLostPet = action.payload;
            })
            .addCase(fetchLostPetById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Create lost pet
            .addCase(createLostPet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLostPet.fulfilled, (state, action) => {
                state.loading = false;
                state.lostPets.unshift(action.payload);
            })
            .addCase(createLostPet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Add comment
            .addCase(addComment.fulfilled, (state, action) => {
                state.currentLostPet = action.payload;
            })
            
            // Update status
            .addCase(updateStatus.fulfilled, (state, action) => {
                state.currentLostPet = action.payload;
                // Update in list as well
                const index = state.lostPets.findIndex(pet => pet._id === action.payload._id);
                if (index !== -1) {
                    state.lostPets[index] = action.payload;
                }
            });
    }
});

export const { setUserLocation, clearCurrentLostPet, clearError } = lostPetSlice.actions;
export default lostPetSlice.reducer;
