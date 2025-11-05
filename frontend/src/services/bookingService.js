import { getBookings, createBooking } from './api';

export const bookingService = {
    // Get user's bookings
    getBookings: async () => {
        try {
            const response = await getBookings();
            return response.data;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    },

    // Create new booking
    createBooking: async (bookingData) => {
        try {
            const response = await createBooking(bookingData);
            return response.data;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }
};

export default bookingService;
