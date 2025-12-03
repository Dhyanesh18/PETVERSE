import { useSelector, useDispatch } from 'react-redux';
import {
    // Actions
    setServiceFilters,
    clearServiceFilters,
    clearSelectedService,
    setEventFilters,
    clearEventFilters,
    clearSelectedEvent,
    clearErrors,
    
    // Thunks
    fetchServices,
    fetchServiceById,
    fetchEvents,
    fetchEventById,
    registerForEventAction,
    
    // Selectors
    selectServices,
    selectSelectedService,
    selectServicesLoading,
    selectServicesError,
    selectServiceFilters,
    selectFilteredServices,
    
    selectEvents,
    selectSelectedEvent,
    selectEventsLoading,
    selectEventsError,
    selectEventFilters,
    selectFilteredEvents,
    selectRegisteredEvents,
    selectRegistering,
    selectRegisterError
} from '../redux/slices/serviceEventSlice';

export const useServiceEvent = () => {
    const dispatch = useDispatch();
    
    // Service state
    const services = useSelector(selectServices);
    const selectedService = useSelector(selectSelectedService);
    const servicesLoading = useSelector(selectServicesLoading);
    const servicesError = useSelector(selectServicesError);
    const serviceFilters = useSelector(selectServiceFilters);
    const filteredServices = useSelector(selectFilteredServices);
    
    // Event state
    const events = useSelector(selectEvents);
    const selectedEvent = useSelector(selectSelectedEvent);
    const eventsLoading = useSelector(selectEventsLoading);
    const eventsError = useSelector(selectEventsError);
    const eventFilters = useSelector(selectEventFilters);
    const filteredEvents = useSelector(selectFilteredEvents);
    const registeredEvents = useSelector(selectRegisteredEvents);
    const registering = useSelector(selectRegistering);
    const registerError = useSelector(selectRegisterError);
    
    // Service methods
    const loadServices = (params) => dispatch(fetchServices(params));
    const loadServiceById = (id) => dispatch(fetchServiceById(id));
    const updateServiceFilters = (filters) => dispatch(setServiceFilters(filters));
    const resetServiceFilters = () => dispatch(clearServiceFilters());
    const clearService = () => dispatch(clearSelectedService());
    
    // Event methods
    const loadEvents = (params) => dispatch(fetchEvents(params));
    const loadEventById = (id) => dispatch(fetchEventById(id));
    const registerForEvent = (registrationData) => dispatch(registerForEventAction(registrationData));
    const updateEventFilters = (filters) => dispatch(setEventFilters(filters));
    const resetEventFilters = () => dispatch(clearEventFilters());
    const clearEvent = () => dispatch(clearSelectedEvent());
    
    // Common methods
    const clearAllErrors = () => dispatch(clearErrors());
    
    return {
        // Service state
        services,
        selectedService,
        servicesLoading,
        servicesError,
        serviceFilters,
        filteredServices,
        
        // Event state
        events,
        selectedEvent,
        eventsLoading,
        eventsError,
        eventFilters,
        filteredEvents,
        registeredEvents,
        registering,
        registerError,
        
        // Service methods
        loadServices,
        loadServiceById,
        updateServiceFilters,
        resetServiceFilters,
        clearService,
        
        // Event methods
        loadEvents,
        loadEventById,
        registerForEvent,
        updateEventFilters,
        resetEventFilters,
        clearEvent,
        
        // Common methods
        clearAllErrors
    };
};

export default useServiceEvent;
