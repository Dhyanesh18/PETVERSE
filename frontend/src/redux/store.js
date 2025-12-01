import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['auth/login', 'auth/setUser'],
                // Increase threshold to 64ms to reduce warnings in dev mode
                warnAfter: 64,
            },
            // Reduce execution time of immutability check
            immutableCheck: {
                warnAfter: 64,
            },
        }),
});

export default store;
