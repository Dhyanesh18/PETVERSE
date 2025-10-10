const Event = require('../models/event');
const User = require('../models/users');

// Get all events (public listing) - Renders initial page
exports.getEvents = async (req, res) => {
    try {
        res.render('events', {
            user: req.user || null,
            filters: {
                category: 'all',
                city: '',
                date: '',
                feeType: 'all'
            }
        });
    } catch (err) {
        console.error('Error loading events page:', err);
        res.status(500).render('error', {
            message: 'Failed to load events page'
        });
    }
};

// API endpoint to fetch events with filters
exports.getEventsAPI = async (req, res) => {
    try {
        const { category, city, date, feeType, search } = req.query;

        // Build query
        let query = { status: 'upcoming', eventDate: { $gte: new Date() } };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (city) {
            query['location.city'] = new RegExp(city, 'i');
        }

        if (date) {
            const selectedDate = new Date(date);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            query.eventDate = { $gte: selectedDate, $lt: nextDay };
        }

        // Fee type filter
        if (feeType === 'free') {
            query.entryFee = 0;
        } else if (feeType === 'paid') {
            query.entryFee = { $gt: 0 };
        }

        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') }
            ];
        }

        const events = await Event.find(query)
            .populate('organizer', 'fullName email')
            .sort({ eventDate: 1 })
            .lean();

        // Add formatted date and available slots
        const eventsWithDetails = events.map(event => ({
            ...event,
            formattedDate: new Date(event.eventDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            availableSlots: event.maxAttendees - event.attendees.length,
            isFull: event.attendees.length >= event.maxAttendees
        }));

        res.json({
            success: true,
            events: eventsWithDetails,
            count: eventsWithDetails.length
        });
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load events'
        });
    }
};

// Get single event details
exports.getEventDetails = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'fullName email phone')
            .populate('attendees.user', 'fullName email');

        if (!event) {
            return res.status(404).render('error', {
                message: 'Event not found'
            });
        }

        const isRegistered = req.user ? event.isUserRegistered(req.user._id) : false;

        res.render('event-detail', {
            event,
            user: req.user || null,
            isRegistered,
            availableSlots: event.availableSlots,
            isFull: event.isFull
        });
    } catch (err) {
        console.error('Error fetching event details:', err);
        res.status(500).render('error', {
            message: 'Failed to load event details'
        });
    }
};

// Show add event form (service provider only)
exports.showAddEventForm = (req, res) => {
    res.render('add-event', {
        user: req.user,
        error: null
    });
};

// Create new event (service provider only)
exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            eventDate,
            startTime,
            endTime,
            venue,
            address,
            city,
            entryFee,
            maxAttendees,
            contactEmail,
            contactPhone,
            tags
        } = req.body;

        // Validate event date
        if (new Date(eventDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Event date must be in the future'
            });
        }

        // Check if permission document is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Government permission letter is required'
            });
        }

        // Process permission document
        const permissionDocument = {
            data: req.file.buffer,
            contentType: req.file.mimetype
        };

        const newEvent = new Event({
            title,
            description,
            category,
            eventDate: new Date(eventDate),
            startTime,
            endTime,
            location: { venue, address, city },
            entryFee: parseFloat(entryFee) || 0,
            maxAttendees: parseInt(maxAttendees),
            organizer: req.user._id,
            permissionDocument,
            contactEmail: contactEmail || req.user.email,
            contactPhone: contactPhone || req.user.phone,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        await newEvent.save();

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            eventId: newEvent._id
        });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to create event'
        });
    }
};

// Register for event
exports.registerForEvent = async (req, res) => {
    try {
        const { eventId, numberOfPets, specialRequirements } = req.body;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event is full
        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({
                success: false,
                message: 'Event is full'
            });
        }

        // Check if already registered
        if (event.isUserRegistered(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event'
            });
        }

        // Add attendee
        event.attendees.push({
            user: req.user._id,
            numberOfPets: parseInt(numberOfPets) || 1,
            specialRequirements: specialRequirements || ''
        });

        await event.save();

        res.status(200).json({
            success: true,
            message: 'Successfully registered for event',
            availableSlots: event.availableSlots
        });
    } catch (err) {
        console.error('Error registering for event:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to register for event'
        });
    }
};

// Unregister from event
exports.unregisterFromEvent = async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Remove attendee
        event.attendees = event.attendees.filter(
            attendee => attendee.user.toString() !== req.user._id.toString()
        );

        await event.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unregistered from event'
        });
    } catch (err) {
        console.error('Error unregistering from event:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to unregister from event'
        });
    }
};

// Get my events (registered events)
exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({
            'attendees.user': req.user._id,
            eventDate: { $gte: new Date() }
        })
            .populate('organizer', 'fullName')
            .sort({ eventDate: 1 });

        res.render('my-events', {
            events,
            user: req.user
        });
    } catch (err) {
        console.error('Error fetching my events:', err);
        res.status(500).render('error', {
            message: 'Failed to load your events'
        });
    }
};

// Get organizer events (service provider dashboard)
exports.getOrganizerEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id })
            .populate('attendees.user', 'fullName email phone')
            .sort({ eventDate: -1 });

        res.render('organizer-events', {
            events,
            user: req.user
        });
    } catch (err) {
        console.error('Error fetching organizer events:', err);
        res.status(500).render('error', {
            message: 'Failed to load your events'
        });
    }
};
