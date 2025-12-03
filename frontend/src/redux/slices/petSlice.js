import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true
});

// Async thunks for pet operations
export const fetchPets = createAsyncThunk(
    'pet/fetchAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/pets', { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch pets' });
        }
    }
);

export const fetchPetById = createAsyncThunk(
    'pet/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(`/pets/${id}`);
            return response.data.data.pet;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch pet' });
        }
    }
);

// Seller pets are fetched from /api/seller/dashboard endpoint
// Use setSellerPets action to populate from dashboard data

export const addPet = createAsyncThunk(
    'pet/add',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/seller/pets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to add pet' });
        }
    }
);

export const updatePet = createAsyncThunk(
    'pet/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await apiClient.put(`/seller/pets/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update pet' });
        }
    }
);

export const deletePet = createAsyncThunk(
    'pet/delete',
    async (id, { rejectWithValue }) => {
        try {
            await apiClient.delete(`/seller/pets/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to delete pet' });
        }
    }
);

export const togglePetWishlist = createAsyncThunk(
    'pet/toggleWishlist',
    async (petId, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(`/wishlist/pet/${petId}/toggle`);
            return { petId, isWishlisted: response.data.data.isWishlisted };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update wishlist' });
        }
    }
);

const petSlice = createSlice({
    name: 'pet',
    initialState: {
        pets: [],
        sellerPets: [],
        selectedPet: null,
        wishlist: [],
        loading: false,
        error: null,
        filters: {
            categories: [],
            breeds: [],
            ages: [],
            minPrice: '',
            maxPrice: ''
        },
        pagination: {
            page: 1,
            total: 0,
            limit: 10
        }
    },
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {
                categories: [],
                breeds: [],
                ages: [],
                minPrice: '',
                maxPrice: ''
            };
        },
        setPage: (state, action) => {
            state.pagination.page = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedPet: (state) => {
            state.selectedPet = null;
        },
        setWishlist: (state, action) => {
            state.wishlist = action.payload;
        },
        setSellerPets: (state, action) => {
            state.sellerPets = action.payload;
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all pets
            .addCase(fetchPets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPets.fulfilled, (state, action) => {
                state.loading = false;
                state.pets = action.payload;
            })
            .addCase(fetchPets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load pets';
            })
            
            // Fetch pet by ID
            .addCase(fetchPetById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPetById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedPet = action.payload;
            })
            .addCase(fetchPetById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load pet';
            })
            
            // Add pet
            .addCase(addPet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addPet.fulfilled, (state, action) => {
                state.loading = false;
                state.sellerPets.push(action.payload);
                state.pets.push(action.payload);
            })
            .addCase(addPet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to add pet';
            })
            
            // Update pet
            .addCase(updatePet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePet.fulfilled, (state, action) => {
                state.loading = false;
                const updatedPet = action.payload;
                
                // Update in pets array
                const petIndex = state.pets.findIndex(p => p._id === updatedPet._id);
                if (petIndex !== -1) {
                    state.pets[petIndex] = updatedPet;
                }
                
                // Update in sellerPets array
                const sellerPetIndex = state.sellerPets.findIndex(p => p._id === updatedPet._id);
                if (sellerPetIndex !== -1) {
                    state.sellerPets[sellerPetIndex] = updatedPet;
                }
                
                // Update selectedPet if it's the same one
                if (state.selectedPet?._id === updatedPet._id) {
                    state.selectedPet = updatedPet;
                }
            })
            .addCase(updatePet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update pet';
            })
            
            // Delete pet
            .addCase(deletePet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePet.fulfilled, (state, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.pets = state.pets.filter(p => p._id !== deletedId);
                state.sellerPets = state.sellerPets.filter(p => p._id !== deletedId);
            })
            .addCase(deletePet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to delete pet';
            })
            
            // Toggle wishlist
            .addCase(togglePetWishlist.fulfilled, (state, action) => {
                const { petId, isWishlisted } = action.payload;
                if (isWishlisted) {
                    if (!state.wishlist.includes(petId)) {
                        state.wishlist.push(petId);
                    }
                } else {
                    state.wishlist = state.wishlist.filter(id => id !== petId);
                }
            });
    }
});

export const { 
    setFilters, 
    clearFilters, 
    setPage, 
    clearError, 
    clearSelectedPet,
    setWishlist,
    setSellerPets
} = petSlice.actions;

export default petSlice.reducer;
