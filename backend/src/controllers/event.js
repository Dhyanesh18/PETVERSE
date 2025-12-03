const Event = require('../models/event');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const Transaction = require('../models/transaction');

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
            availableSlots: event.availableSlots,
            eventId: event._id,
            entryFee: event.entryFee || 0
        });
    } catch (err) {
        console.error('Error registering for event:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to register for event'
        });
    }
};

// View ticket for a registered user
exports.getTicketForUser = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).populate('organizer', 'fullName email').lean();
        if (!event) {
            return res.status(404).render('error', { message: 'Event not found' });
        }

        // Verify registration
        const attendee = (event.attendees || []).find(a => a.user.toString() === req.user._id.toString());
        if (!attendee) {
            return res.status(403).render('error', { message: 'You are not registered for this event' });
        }

        const ticket = {
            eventId: event._id,
            title: event.title,
            category: event.category,
            date: event.eventDate,
            startTime: event.startTime,
            endTime: event.endTime,
            venue: event.location?.venue,
            city: event.location?.city,
            attendeeName: req.user.fullName,
            numberOfPets: attendee.numberOfPets || 1,
            registeredAt: attendee.registeredAt,
            organizerName: event.organizer?.fullName || 'Organizer'
        };

        return res.render('event-ticket', { user: req.user, ticket });
    } catch (err) {
        console.error('Get ticket error:', err);
        return res.status(500).render('error', { message: 'Failed to load ticket' });
    }
};

// Render event payment page similar to checkout/payment.ejs
exports.getEventPaymentPage = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).lean();
        if (!event) return res.status(404).render('error', { message: 'Event not found' });

        // Ensure user is registered before paying
        const isRegistered = event.attendees && event.attendees.some(a => a.user.toString() === req.user._id.toString());
        if (!isRegistered) return res.status(403).render('error', { message: 'Register for the event first' });

        const wallet = await Wallet.findOne({ user: req.user._id });
        res.render('event-payment', {
            user: req.user,
            wallet: wallet || { balance: 0 },
            event
        });
    } catch (err) {
        console.error('Event payment page error:', err);
        res.status(500).render('error', { message: 'Failed to load payment page' });
    }
};

// Handle event payment (wallet) and redirect to ticket
exports.payForEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const isRegistered = event.attendees && event.attendees.some(a => a.user.toString() === req.user._id.toString());
        if (!isRegistered) return res.status(403).json({ success: false, message: 'Register for the event first' });

        const amount = event.entryFee || 0;
        const { paymentMethod, details } = req.body || {};

        // Support wallet, upi, and credit-card methods
        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ user: req.user._id });
            if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found' });
            if (amount > 0) {
                if (wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
                await wallet.deductFunds(amount);
                
                // Create transaction record for event payment
                await new Transaction({
                    from: req.user._id,
                    to: req.user._id,
                    amount: amount,
                    type: 'event_payment',
                    description: `Payment for event: ${event.name}`
                }).save();
            }
        } else if (paymentMethod === 'upi') {
            // Basic UPI validation
            const upiId = details && details.upiId ? String(details.upiId).trim() : '';
            const upiRegex = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
            if (!upiRegex.test(upiId)) {
                return res.status(400).json({ success: false, message: 'Invalid UPI ID' });
            }
            // Assume external UPI success for this implementation (no charge capture)
        } else if (paymentMethod === 'credit-card') {
            // Basic card validation (format only)
            const name = details && details.cardName ? String(details.cardName).trim() : '';
            const number = details && details.cardNumber ? String(details.cardNumber).replace(/\s+/g, '') : '';
            const expiry = details && details.expiryDate ? String(details.expiryDate).trim() : '';
            const cvv = details && details.cvv ? String(details.cvv).trim() : '';
            const numRegex = /^\d{13,19}$/; // simplistic check
            const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
            const cvvRegex = /^\d{3,4}$/;
            if (!name || !numRegex.test(number) || !expRegex.test(expiry) || !cvvRegex.test(cvv)) {
                return res.status(400).json({ success: false, message: 'Invalid card details' });
            }
            // Assume external card success for this implementation (no charge capture)
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported payment method' });
        }

        return res.json({ success: true, redirect: `/events/${eventId}/ticket` });
    } catch (err) {
        console.error('Event payment error:', err);
        return res.status(500).json({ success: false, message: 'Payment failed' });
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
