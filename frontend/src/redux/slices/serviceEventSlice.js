import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getServices, getServiceById, getEvents, getEventById, registerForEvent } from '../../services/api';

// ============ Async Thunks for Services ============

export const fetchServices = createAsyncThunk(
    'serviceEvent/fetchServices',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await getServices(params);
            
            // Handle different response structures
            let servicesData = [];
            if (response.data.success && response.data.data && Array.isArray(response.data.data.services)) {
                servicesData = response.data.data.services;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                servicesData = response.data.data;
            } else if (Array.isArray(response.data.services)) {
                servicesData = response.data.services;
            } else if (Array.isArray(response.data)) {
                servicesData = response.data;
            }
            
            return servicesData;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
        }
    }
);

export const fetchServiceById = createAsyncThunk(
    'serviceEvent/fetchServiceById',
    async (serviceId, { rejectWithValue }) => {
        try {
            const response = await getServiceById(serviceId);
            return response.data.data?.service || response.data.service || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch service details');
        }
    }
);

// ============ Async Thunks for Events ============

export const fetchEvents = createAsyncThunk(
    'serviceEvent/fetchEvents',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await getEvents(params);
            const eventsData = response.data.data?.events || response.data.events || [];
            return eventsData;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
        }
    }
);

export const fetchEventById = createAsyncThunk(
    'serviceEvent/fetchEventById',
    async (eventId, { rejectWithValue }) => {
        try {
            const response = await getEventById(eventId);
            return response.data.data?.event || response.data.event || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch event details');
        }
    }
);

export const registerForEventAction = createAsyncThunk(
    'serviceEvent/registerForEvent',
    async (registrationData, { rejectWithValue }) => {
        try {
            const response = await registerForEvent(registrationData);
            return {
                eventId: registrationData.eventId,
                data: response.data
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to register for event');
        }
    }
);

// ============ Initial State ============

const initialState = {
    // Services state
    services: [],
    selectedService: null,
    servicesLoading: false,
    servicesError: null,
    
    // Events state
    events: [],
    selectedEvent: null,
    eventsLoading: false,
    eventsError: null,
    registeredEvents: [],
    
    // Filters
    serviceFilters: {
        categories: [],
        minPrice: '',
        maxPrice: '',
        minRating: '',
        location: ''
    },
    eventFilters: {
        category: 'all',
        feeType: 'all',
        city: '',
        date: ''
    },
    
    // UI state
    lastFetch: null,
    registering: false,
    registerError: null
};

// ============ Slice ============

const serviceEventSlice = createSlice({
    name: 'serviceEvent',
    initialState,
    reducers: {
        // Service actions
        setServiceFilters: (state, action) => {
            state.serviceFilters = { ...state.serviceFilters, ...action.payload };
        },
        clearServiceFilters: (state) => {
            state.serviceFilters = initialState.serviceFilters;
        },
        clearSelectedService: (state) => {
            state.selectedService = null;
        },
        
        // Event actions
        setEventFilters: (state, action) => {
            state.eventFilters = { ...state.eventFilters, ...action.payload };
        },
        clearEventFilters: (state) => {
            state.eventFilters = initialState.eventFilters;
        },
        clearSelectedEvent: (state) => {
            state.selectedEvent = null;
        },
        
        // Clear all errors
        clearErrors: (state) => {
            state.servicesError = null;
            state.eventsError = null;
            state.registerError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // ===== Fetch Services =====
            .addCase(fetchServices.pending, (state) => {
                state.servicesLoading = true;
                state.servicesError = null;
            })
            .addCase(fetchServices.fulfilled, (state, action) => {
                state.servicesLoading = false;
                state.services = action.payload;
                state.lastFetch = new Date().toISOString();
                state.servicesError = null;
            })
            .addCase(fetchServices.rejected, (state, action) => {
                state.servicesLoading = false;
                state.servicesError = action.payload;
            })
            
            // ===== Fetch Service by ID =====
            .addCase(fetchServiceById.pending, (state) => {
                state.servicesLoading = true;
                state.servicesError = null;
            })
            .addCase(fetchServiceById.fulfilled, (state, action) => {
                state.servicesLoading = false;
                state.selectedService = action.payload;
                state.servicesError = null;
            })
            .addCase(fetchServiceById.rejected, (state, action) => {
                state.servicesLoading = false;
                state.servicesError = action.payload;
            })
            
            // ===== Fetch Events =====
            .addCase(fetchEvents.pending, (state) => {
                state.eventsLoading = true;
                state.eventsError = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.eventsLoading = false;
                state.events = action.payload;
                state.lastFetch = new Date().toISOString();
                state.eventsError = null;
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.eventsLoading = false;
                state.eventsError = action.payload;
            })
            
            // ===== Fetch Event by ID =====
            .addCase(fetchEventById.pending, (state) => {
                state.eventsLoading = true;
                state.eventsError = null;
            })
            .addCase(fetchEventById.fulfilled, (state, action) => {
                state.eventsLoading = false;
                state.selectedEvent = action.payload;
                state.eventsError = null;
            })
            .addCase(fetchEventById.rejected, (state, action) => {
                state.eventsLoading = false;
                state.eventsError = action.payload;
            })
            
            // ===== Register for Event =====
            .addCase(registerForEventAction.pending, (state) => {
                state.registering = true;
                state.registerError = null;
            })
            .addCase(registerForEventAction.fulfilled, (state, action) => {
                state.registering = false;
                const { eventId } = action.payload;
                
                // Update the event in the list if it exists
                const eventIndex = state.events.findIndex(e => e._id === eventId);
                if (eventIndex !== -1) {
                    state.events[eventIndex].isRegistered = true;
                }
                
                // Update selected event if it's the same
                if (state.selectedEvent?._id === eventId) {
                    state.selectedEvent.isRegistered = true;
                }
                
                // Add to registered events
                if (!state.registeredEvents.includes(eventId)) {
                    state.registeredEvents.push(eventId);
                }
                
                state.registerError = null;
            })
            .addCase(registerForEventAction.rejected, (state, action) => {
                state.registering = false;
                state.registerError = action.payload;
            });
    }
});

// ============ Actions ============
export const {
    setServiceFilters,
    clearServiceFilters,
    clearSelectedService,
    setEventFilters,
    clearEventFilters,
    clearSelectedEvent,
    clearErrors
} = serviceEventSlice.actions;

// ============ Selectors ============

// Service selectors
export const selectServices = (state) => state.serviceEvent.services;
export const selectSelectedService = (state) => state.serviceEvent.selectedService;
export const selectServicesLoading = (state) => state.serviceEvent.servicesLoading;
export const selectServicesError = (state) => state.serviceEvent.servicesError;
export const selectServiceFilters = (state) => state.serviceEvent.serviceFilters;

// Event selectors
export const selectEvents = (state) => state.serviceEvent.events;
export const selectSelectedEvent = (state) => state.serviceEvent.selectedEvent;
export const selectEventsLoading = (state) => state.serviceEvent.eventsLoading;
export const selectEventsError = (state) => state.serviceEvent.eventsError;
export const selectEventFilters = (state) => state.serviceEvent.eventFilters;
export const selectRegisteredEvents = (state) => state.serviceEvent.registeredEvents;
export const selectRegistering = (state) => state.serviceEvent.registering;
export const selectRegisterError = (state) => state.serviceEvent.registerError;

// Filtered selectors
export const selectFilteredServices = (state) => {
    const { services, serviceFilters } = state.serviceEvent;
    let filtered = [...services];

    // Filter by categories
    if (serviceFilters.categories.length > 0) {
        filtered = filtered.filter(service => 
            serviceFilters.categories.includes(service.serviceType?.toLowerCase())
        );
    }

    // Filter by price range
    if (serviceFilters.minPrice) {
        filtered = filtered.filter(service => service.price >= parseFloat(serviceFilters.minPrice));
    }
    if (serviceFilters.maxPrice) {
        filtered = filtered.filter(service => service.price <= parseFloat(serviceFilters.maxPrice));
    }

    // Filter by rating
    if (serviceFilters.minRating) {
        filtered = filtered.filter(service => service.avgRating >= parseFloat(serviceFilters.minRating));
    }

    // Filter by location
    if (serviceFilters.location) {
        filtered = filtered.filter(service => 
            service.serviceAddress?.toLowerCase().includes(serviceFilters.location.toLowerCase())
        );
    }

    return filtered;
};

export const selectFilteredEvents = (state) => {
    const { events, eventFilters } = state.serviceEvent;
    let filtered = [...events];

    // Filter by category
    if (eventFilters.category && eventFilters.category !== 'all') {
        filtered = filtered.filter(event => event.category === eventFilters.category);
    }

    // Filter by fee type
    if (eventFilters.feeType === 'free') {
        filtered = filtered.filter(event => event.entryFee === 0);
    } else if (eventFilters.feeType === 'paid') {
        filtered = filtered.filter(event => event.entryFee > 0);
    }

    // Filter by city
    if (eventFilters.city) {
        filtered = filtered.filter(event => 
            event.location?.city?.toLowerCase().includes(eventFilters.city.toLowerCase())
        );
    }

    // Filter by date
    if (eventFilters.date) {
        const filterDate = new Date(eventFilters.date).toDateString();
        filtered = filtered.filter(event => 
            new Date(event.eventDate).toDateString() === filterDate
        );
    }

    return filtered;
};

export default serviceEventSlice.reducer;
