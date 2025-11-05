import { getOrders, getOrderById } from './api';

export const orderService = {
    // Get user's orders
    getOrders: async () => {
        try {
            const response = await getOrders();
            return response.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    // Get specific order by ID
    getOrderById: async (orderId) => {
        try {
            const response = await getOrderById(orderId);
            return response.data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }
};

export default orderService;
