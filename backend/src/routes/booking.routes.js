const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/users');
const Availability = require('../models/availability');

const getDayName = (dayNum) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNum];
};

const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
};

// Get service provider details and booking information
router.get('/:serviceId', isAuthenticated, async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        
        // Find provider information from user model with role="service_provider"
        const provider = await User.findById(serviceId);
        
        if (!provider || provider.role !== 'service_provider') {
        return res.status(404).json({
            success: false,
            error: 'Service provider not found'
        });
        }
        
        // Create a service object with provider details
        const service = {
        _id: provider._id,
        name: provider.fullName,
        serviceType: provider.serviceType,
        description: provider.description || 'Professional pet services provider.',
        location: provider.serviceAddress || 'Available Locally',
        rate: provider.serviceType === 'veterinarian' ? 500 : 
                provider.serviceType === 'groomer' ? 300 : 
                provider.serviceType === 'trainer' ? 500 : 200,
        email: provider.email,
        phone: provider.phoneNo
        };
        
        res.json({
        success: true,
        data: {
            service,
            user: {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email
            }
        }
        });
    } catch (err) {
        console.error('Error loading booking data:', err);
        res.status(500).json({
        success: false,
        error: 'Server error loading booking information',
        message: err.message
        });
    }
});

// Get available time slots for a specific date
router.get('/available/slots', isAuthenticated, async (req, res) => {
    try {
        const { serviceId, date } = req.query;
        
        console.log('=== AVAILABLE SLOTS REQUEST ===');
        console.log('ServiceId:', serviceId);
        console.log('Date:', date);
        console.log('Authenticated user:', req.user?._id);
        
        if (!serviceId || !date) {
        return res.status(400).json({ 
            success: false,
            error: 'Service ID and date are required' 
        });
        }
        
        console.log('Fetching slots for serviceId:', serviceId, 'date:', date);
        
        // Get the day of the week for the selected date
        const selectedDate = new Date(date);
        const dayOfWeek = getDayName(selectedDate.getDay());
        
        console.log('Day of week:', dayOfWeek);
        
        // Get service provider's availability
        const providerAvailability = await Availability.findOne({ serviceProvider: serviceId });
        
        console.log('Provider availability found:', !!providerAvailability);
        
        // Default slots if no availability is set
        let allPossibleSlots = [
        '09:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '01:00 PM', '02:00 PM',
        '03:00 PM', '04:00 PM', '05:00 PM'
        ];

        // If provider has availability settings, check if it's valid
        if (providerAvailability) {
        console.log('Checking provider availability for day:', dayOfWeek);
        
        // Check if provider has ANY working days (days that are not holidays and have slots)
        const hasAnyWorkingDays = providerAvailability.days.some(d => 
            !d.isHoliday && d.slots && d.slots.length > 0
        );
        
        if (!hasAnyWorkingDays) {
            console.log('Provider has no working days configured, using default slots for all days');
            // Treat this as if no availability is configured
            // Fall through to use default slots
        } else {
            const dayAvailability = providerAvailability.getByDay(dayOfWeek);
            console.log('Day availability:', JSON.stringify(dayAvailability));
            
            // Check if this specific day is configured
            const dayExistsInConfig = providerAvailability.days.some(d => d.day === dayOfWeek.toLowerCase());
            
            if (!dayExistsInConfig) {
                console.log('Day not configured in availability, using default slots');
            } else if (dayAvailability.isHoliday) {
                // Only return empty if explicitly marked as holiday AND provider has other working days
                console.log('Day is marked as holiday');
                return res.json({ 
                success: true,
                data: {
                    slots: [],
                    availableSlots: [],
                    totalSlots: 0,
                    bookedSlots: 0,
                    message: 'No slots available for this date'
                }
                });
            } else if (dayAvailability.slots && dayAvailability.slots.length > 0) {
            console.log('Using custom slots from availability');
            // Generate slots based on provider's availability
            allPossibleSlots = [];
            dayAvailability.slots.forEach(slot => {
                // Generate 1-hour slots between start and end times
                const [startHour, startMin] = slot.start.split(':').map(Number);
                const [endHour, endMin] = slot.end.split(':').map(Number);
                
                let currentHour = startHour;
                let currentMin = startMin;
                
                while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
                allPossibleSlots.push(formatTime(timeString));
                
                // Advance by 1 hour
                currentHour++;
                }
            });
        }
        // If no slots configured, allPossibleSlots remains as default
        }
    } else {
        console.log('No provider availability, using default slots');
    }
        
        console.log('Total possible slots:', allPossibleSlots.length);
        
        // Find bookings for this service provider on the selected date
        // The booking.service field references the service provider's User ID directly
        const bookings = await Booking.find({ 
            service: serviceId, 
            date: date 
        });
        
        console.log(`Found ${bookings.length} bookings for provider ${serviceId} on ${date}`);
        
        // Filter out already booked slots
        const bookedSlots = bookings.map(b => b.slot);
        const availableSlots = allPossibleSlots.filter(slot => !bookedSlots.includes(slot));
        
        console.log('All possible slots:', allPossibleSlots.length);
        console.log('Booked slots:', bookedSlots);
        console.log('Available slots:', availableSlots.length);
        
        res.json({ 
        success: true,
        data: {
            slots: availableSlots,
            availableSlots: availableSlots,
            totalSlots: allPossibleSlots.length,
            bookedSlots: bookedSlots.length,
            date: date
        }
        });
        console.log('=== RESPONSE SENT ===\n');
    } catch (err) {
        console.error('Error fetching available slots:', err);
        res.status(500).json({ 
        success: false,
        error: 'Error fetching available slots',
        message: err.message 
        });
    }
});

// Book a time slot
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { serviceId, date, slot, petName } = req.body;
        
        if (!serviceId || !date || !slot) {
        return res.status(400).json({
            success: false,
            error: 'Missing required booking information',
            requiredFields: ['serviceId', 'date', 'slot']
        });
        }
        
        // Find the provider
        const provider = await User.findById(serviceId);
        if (!provider || provider.role !== 'service_provider') {
        return res.status(404).json({
            success: false,
            error: 'Service provider not found'
        });
        }
        
        // Check if slot is already booked
        // The booking.service field stores the service provider's User ID directly
        const existing = await Booking.findOne({ 
        service: serviceId, 
        date, 
        slot 
        });
        
        if (existing) {
        return res.status(409).json({
            success: false,
            error: 'This time slot has already been booked. Please choose another time.'
        });
        }
        
        // Create and save the booking
        // Store the service provider's User ID directly in the service field
        const booking = new Booking({
        user: req.user._id,
        service: serviceId,
        date,
        slot,
        petName: petName || 'Not specified',
        status: 'pending'
        });
        
        await booking.save();
        
        // Populate the booking with user and service provider details
        await booking.populate('user', 'fullName email');
        await booking.populate('service', 'fullName serviceType serviceAddress email phoneNo');
        
        res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
            booking: {
            id: booking._id,
            date: booking.date,
            slot: booking.slot,
            petName: booking.petName,
            status: booking.status,
            user: booking.user,
            provider: booking.service,
            createdAt: booking.createdAt
            },
            redirectPath: `/services/${serviceId}/payment`,
            paymentRequired: true
        }
        });
    } catch (err) {
        console.error('Booking failed:', err);
        res.status(500).json({
        success: false,
        error: 'Booking failed',
        message: err.message
        });
    }
});

// Get user's bookings
router.get('/user/my-bookings', isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
        .populate('service', 'fullName serviceType serviceAddress')
        .sort({ date: -1, createdAt: -1 });
        
        res.json({
        success: true,
        data: {
            bookings
        }
        });
    } catch (err) {
        console.error('Error fetching user bookings:', err);
        res.status(500).json({
        success: false,
        error: 'Error fetching bookings',
        message: err.message
        });
    }
});

// Get specific booking details
router.get('/details/:bookingId', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
        .populate('user', 'fullName email phoneNo')
        .populate('service', 'fullName serviceType serviceAddress');
        
        if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
        }
        
        // Check if user is authorized to view this booking
        if (booking.user._id.toString() !== req.user._id.toString() && 
            booking.service._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'Unauthorized to view this booking'
        });
        }
        
        res.json({
        success: true,
        data: {
            booking
        }
        });
    } catch (err) {
        console.error('Error fetching booking details:', err);
        res.status(500).json({
        success: false,
        error: 'Error fetching booking details',
        message: err.message
        });
    }
    });

    // Cancel a booking
    router.delete('/:bookingId', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        
        if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
        }
        
        // Check if user is authorized to cancel this booking
        if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'Unauthorized to cancel this booking'
        });
        }
        
        // Check if booking can be cancelled (e.g., not in the past)
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (bookingDate < today) {
        return res.status(400).json({
            success: false,
            error: 'Cannot cancel past bookings'
        });
        }
        
        await Booking.findByIdAndDelete(req.params.bookingId);
        
        res.json({
        success: true,
        message: 'Booking cancelled successfully'
        });
    } catch (err) {
        console.error('Error cancelling booking:', err);
        res.status(500).json({
        success: false,
        error: 'Error cancelling booking',
        message: err.message
        });
    }
});

// Update booking status (for service providers)
router.patch('/:bookingId/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.bookingId);
        
        if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
        }
        
        // Check if user is the service provider for this booking
        if (booking.service.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'Unauthorized to update this booking'
        });
        }
        
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status',
            validStatuses
        });
        }
        
        booking.status = status;
        await booking.save();
        
        res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: {
            booking
        }
        });
    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json({
        success: false,
        error: 'Error updating booking status',
        message: err.message
        });
    }
});

// Get bookings for a service provider
router.get('/provider/bookings', isAuthenticated, async (req, res) => {
    try {
        // Check if user is a service provider
        if (req.user.role !== 'service_provider') {
        return res.status(403).json({
            success: false,
            error: 'Only service providers can access this endpoint'
        });
        }
        
        const bookings = await Booking.find({ service: req.user._id })
        .populate('user', 'fullName email phoneNo')
        .sort({ date: 1, createdAt: -1 });
        
        res.json({
        success: true,
        data: {
            bookings
        }
        });
    } catch (err) {
        console.error('Error fetching provider bookings:', err);
        res.status(500).json({
        success: false,
        error: 'Error fetching bookings',
        message: err.message
        });
    }
});

module.exports = router;