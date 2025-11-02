import { getEvents, getEventById, getRegisteredEvents, registerForEvent } from './api';

export const eventService = {
    // Get all events
    getEvents: async () => {
        try {
            const response = await getEvents();
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    // Get specific event by ID
    getEventById: async (eventId) => {
        try {
            const response = await getEventById(eventId);
            return response.data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    },

    // Get user's registered events
    getRegisteredEvents: async () => {
        try {
            const response = await getRegisteredEvents();
            return response.data;
        } catch (error) {
            console.error('Error fetching registered events:', error);
            throw error;
        }
    },

    // Register for an event
    registerForEvent: async (eventId) => {
        try {
            const response = await registerForEvent(eventId);
            return response.data;
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    }
};

export default eventService;
