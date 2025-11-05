import { getWishlist, addToWishlist, removeFromWishlist } from './api';

export const wishlistService = {
    // Get user's wishlist
    getWishlist: async () => {
        try {
            const response = await getWishlist();
            return response.data;
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    },

    // Add item to wishlist
    addToWishlist: async (type, itemId) => {
        try {
            const response = await addToWishlist(type, itemId);
            return response.data;
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw error;
        }
    },

    // Remove item from wishlist
    removeFromWishlist: async (type, itemId) => {
        try {
            const response = await removeFromWishlist(type, itemId);
            return response.data;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    }
};

export default wishlistService;
