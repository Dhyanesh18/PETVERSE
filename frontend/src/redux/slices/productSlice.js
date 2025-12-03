import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true
});

// Async thunks for product operations
export const fetchProducts = createAsyncThunk(
    'product/fetchAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/products', { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch products' });
        }
    }
);

export const fetchProductById = createAsyncThunk(
    'product/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(`/products/${id}`);
            return response.data.data.product;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch product' });
        }
    }
);

// Seller products are fetched from /api/seller/dashboard endpoint
// Use setSellerProducts action to populate from dashboard data

export const addProduct = createAsyncThunk(
    'product/add',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/seller/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to add product' });
        }
    }
);

export const updateProduct = createAsyncThunk(
    'product/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await apiClient.put(`/seller/products/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update product' });
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'product/delete',
    async (id, { rejectWithValue }) => {
        try {
            await apiClient.delete(`/seller/products/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to delete product' });
        }
    }
);

export const toggleProductWishlist = createAsyncThunk(
    'product/toggleWishlist',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(`/wishlist/product/${productId}/toggle`);
            return { productId, isWishlisted: response.data.data.isWishlisted };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update wishlist' });
        }
    }
);

const productSlice = createSlice({
    name: 'product',
    initialState: {
        products: [],
        sellerProducts: [],
        selectedProduct: null,
        wishlist: [],
        loading: false,
        error: null,
        filters: {
            categories: [],
            brands: [],
            minPrice: '',
            maxPrice: '',
            ratings: []
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
                brands: [],
                minPrice: '',
                maxPrice: '',
                ratings: []
            };
        },
        setPage: (state, action) => {
            state.pagination.page = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedProduct: (state) => {
            state.selectedProduct = null;
        },
        setWishlist: (state, action) => {
            state.wishlist = action.payload;
        },
        setSellerProducts: (state, action) => {
            state.sellerProducts = action.payload;
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all products
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load products';
            })
            
            // Fetch product by ID
            .addCase(fetchProductById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedProduct = action.payload;
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load product';
            })
            
            // Add product
            .addCase(addProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.sellerProducts.push(action.payload);
                state.products.push(action.payload);
            })
            .addCase(addProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to add product';
            })
            
            // Update product
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.loading = false;
                const updatedProduct = action.payload;
                
                // Update in products array
                const productIndex = state.products.findIndex(p => p._id === updatedProduct._id);
                if (productIndex !== -1) {
                    state.products[productIndex] = updatedProduct;
                }
                
                // Update in sellerProducts array
                const sellerProductIndex = state.sellerProducts.findIndex(p => p._id === updatedProduct._id);
                if (sellerProductIndex !== -1) {
                    state.sellerProducts[sellerProductIndex] = updatedProduct;
                }
                
                // Update selectedProduct if it's the same one
                if (state.selectedProduct?._id === updatedProduct._id) {
                    state.selectedProduct = updatedProduct;
                }
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update product';
            })
            
            // Delete product
            .addCase(deleteProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.products = state.products.filter(p => p._id !== deletedId);
                state.sellerProducts = state.sellerProducts.filter(p => p._id !== deletedId);
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to delete product';
            })
            
            // Toggle wishlist
            .addCase(toggleProductWishlist.fulfilled, (state, action) => {
                const { productId, isWishlisted } = action.payload;
                if (isWishlisted) {
                    if (!state.wishlist.includes(productId)) {
                        state.wishlist.push(productId);
                    }
                } else {
                    state.wishlist = state.wishlist.filter(id => id !== productId);
                }
            });
    }
});

export const { 
    setFilters, 
    clearFilters, 
    setPage, 
    clearError, 
    clearSelectedProduct,
    setWishlist,
    setSellerProducts
} = productSlice.actions;

export default productSlice.reducer;
