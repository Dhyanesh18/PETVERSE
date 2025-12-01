import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
    getCart, 
    addToCart as addToCartAPI, 
    removeFromCart as removeFromCartAPI, 
    clearCart as clearCartAPI 
} from '../../services/api';

// Helper to get cart from localStorage
const getCartFromLocalStorage = () => {
    try {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        return [];
    }
};

// Helper to calculate cart count
const calculateCartCount = (items) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
};

// Async thunks
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async () => {
        try {
            const response = await getCart();
            const cartData = response.data;
            console.log('Cart API response:', cartData);
            
            const cart = cartData.data?.cart;
            const items = cart?.items || [];
            console.log('Cart items:', items);
            console.log('Cart items length:', items?.length);
            
            const count = cart?.totalItems || calculateCartCount(items);
            console.log('Calculated cart count:', count);
            
            return { items, count };
        } catch (error) {
            // If it's an authentication error (401), don't log it as an error
            if (error.response?.status !== 401) {
                console.error('Failed to fetch cart:', error);
            }
            // Fallback to localStorage
            const localCart = getCartFromLocalStorage();
            const count = calculateCartCount(localCart);
            return { items: localCart, count };
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async (itemData, { dispatch }) => {
        try {
            console.log('CartSlice: Adding item to cart:', itemData);
            const response = await addToCartAPI(itemData);
            console.log('CartSlice: Add to cart API response:', response.data);
            
            // Refresh cart after adding
            dispatch(fetchCart());
            
            return response.data;
        } catch (error) {
            console.error('Failed to add to cart:', error);
            
            // Fallback to localStorage
            const localCart = getCartFromLocalStorage();
            const existingItem = localCart.find(item => 
                item.productId === itemData.productId || item.serviceId === itemData.serviceId
            );
            
            if (existingItem) {
                existingItem.quantity += itemData.quantity || 1;
            } else {
                localCart.push(itemData);
            }
            
            localStorage.setItem('cart', JSON.stringify(localCart));
            const count = calculateCartCount(localCart);
            
            return { items: localCart, count };
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (itemId, { rejectWithValue, dispatch }) => {
        try {
            await removeFromCartAPI(itemId);
            // Refresh cart after removing
            dispatch(fetchCart());
            return itemId;
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            return rejectWithValue(error.response?.data);
        }
    }
);

export const clearCart = createAsyncThunk(
    'cart/clearCart',
    async () => {
        try {
            await clearCartAPI();
            localStorage.removeItem('cart');
            return { items: [], count: 0 };
        } catch (error) {
            console.error('Failed to clear cart:', error);
            // Fallback to local clear
            localStorage.removeItem('cart');
            return { items: [], count: 0 };
        }
    }
);

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: getCartFromLocalStorage(),
        cartCount: calculateCartCount(getCartFromLocalStorage()),
        loading: false,
        error: null,
    },
    reducers: {
        loadCartFromLocalStorage: (state) => {
            const localCart = getCartFromLocalStorage();
            state.items = localCart;
            state.cartCount = calculateCartCount(localCart);
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.items = action.payload.items;
                state.cartCount = action.payload.count;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add to cart
            .addCase(addToCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                if (action.payload.items) {
                    state.items = action.payload.items;
                    state.cartCount = action.payload.count;
                }
                state.loading = false;
                state.error = null;
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Remove from cart
            .addCase(removeFromCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(removeFromCart.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(removeFromCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Clear cart
            .addCase(clearCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(clearCart.fulfilled, (state, action) => {
                state.items = action.payload.items;
                state.cartCount = action.payload.count;
                state.loading = false;
                state.error = null;
            })
            .addCase(clearCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { loadCartFromLocalStorage } = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.cartCount;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;
