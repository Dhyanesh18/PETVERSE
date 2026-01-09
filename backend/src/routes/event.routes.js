const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const multer = require('multer');
const path = require('path');

// Configure multer for document uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: function (req, file, callback) {
        // Get file extension
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Allowed extensions for permission document
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        
        // Allowed MIME types
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        // Check both extension and MIME type
        if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed for permission document'));
        }
    }
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirectPath: '/login'
    });
}

// Middleware to check if user is service provider
function isServiceProvider(req, res, next) {
    if (req.user && req.user.role === 'service_provider') {
        return next();
    }
    res.status(403).json({
        success: false,
        error: 'Access denied. Service providers only.'
    });
}

// Middleware to allow only pet owners
function isOwner(req, res, next) {
    if (req.user && req.user.role === 'owner') {
        return next();
    }
    return res.status(403).json({
        success: false,
        error: 'Access denied. Only pet owners can register for events.'
    });
}

// Public routes ----------------------------------------------------

// Get all events with filters (API endpoint)
router.get('/', async (req, res) => {
    try {
        const { category, city, date, feeType, search } = req.query;

        // Build query - show all future events regardless of status
        let query = { eventDate: { $gte: new Date() } };

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

        console.log('Events query:', JSON.stringify(query));
        const events = await Event.find(query)
            .populate('organizer', 'fullName email')
            .sort({ eventDate: 1 })
            .lean();
        
        console.log(`Found ${events.length} events`);

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
            data: {
                events: eventsWithDetails,
                count: eventsWithDetails.length,
                filters: {
                    category: category || 'all',
                    city: city || '',
                    date: date || '',
                    feeType: feeType || 'all',
                    search: search || ''
                }
            }
        });
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to load events',
            message: err.message
        });
    }
});

// Get single event details
router.get('/:id', async (req, res) => {
    try {
        console.log('GET /api/events/:id - req.user:', req.user ? req.user._id : 'null');
        console.log('GET /api/events/:id - req.session.userId:', req.session.userId);
        
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'fullName email phone')
            .populate('attendees.user', 'fullName email');

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const isRegistered = req.user ? event.isUserRegistered(req.user._id) : false;
        console.log('isUserRegistered result:', isRegistered);
        
        const availableSlots = event.maxAttendees - event.attendees.length;
        const isFull = event.attendees.length >= event.maxAttendees;

        res.json({
            success: true,
            data: {
                event: {
                    _id: event._id,
                    title: event.title,
                    description: event.description,
                    category: event.category,
                    eventDate: event.eventDate,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    location: event.location,
                    entryFee: event.entryFee,
                    maxAttendees: event.maxAttendees,
                    organizer: event.organizer,
                    contactEmail: event.contactEmail,
                    contactPhone: event.contactPhone,
                    tags: event.tags,
                    status: event.status,
                    attendees: event.attendees,
                    permissionDocument: event.permissionDocument ? {
                        contentType: event.permissionDocument.contentType
                    } : null,
                    createdAt: event.createdAt,
                    formattedDate: new Date(event.eventDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                },
                isRegistered,
                availableSlots,
                isFull,
                user: req.user || null
            }
        });
    } catch (err) {
        console.error('Error fetching event details:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to load event details',
            message: err.message
        });
    }
});

// Service Provider Routes ------------------------------------------

// Create new event (service provider only)
router.post('/add', isAuthenticated, isServiceProvider, upload.single('permissionDocument'), async (req, res) => {
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
                error: 'Event date must be in the future'
            });
        }

        // Check if permission document is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Government permission letter is required'
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
            data: {
                eventId: newEvent._id,
                title: newEvent.title,
                eventDate: newEvent.eventDate
            }
        });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to create event',
            message: err.message
        });
    }
});

// Get organizer events (service provider dashboard)
router.get('/my/organized', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id })
            .populate('attendees.user', 'fullName email phone')
            .sort({ eventDate: -1 });

        const eventsWithStats = events.map(event => ({
            _id: event._id,
            title: event.title,
            description: event.description,
            category: event.category,
            eventDate: event.eventDate,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            entryFee: event.entryFee,
            maxAttendees: event.maxAttendees,
            attendees: event.attendees,
            status: event.status,
            attendeeCount: event.attendees.length,
            availableSlots: event.maxAttendees - event.attendees.length,
            isFull: event.attendees.length >= event.maxAttendees,
            formattedDate: new Date(event.eventDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }));

        res.json({
            success: true,
            data: {
                events: eventsWithStats,
                total: eventsWithStats.length
            }
        });
    } catch (err) {
        console.error('Error fetching organizer events:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to load your events',
            message: err.message
        });
    }
});

// Owner Routes -----------------------------------------------------

// Register for event
router.post('/register', isAuthenticated, isOwner, async (req, res) => {
    try {
        const { eventId, numberOfPets, specialRequirements } = req.body;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        // Check if event is full
        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({
                success: false,
                error: 'Event is full'
            });
        }

        // Check if already registered
        if (event.isUserRegistered(req.user._id)) {
            return res.status(400).json({
                success: false,
                error: 'You are already registered for this event'
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
            data: {
                availableSlots: event.maxAttendees - event.attendees.length,
                eventId: event._id,
                entryFee: event.entryFee || 0,
                requiresPayment: event.entryFee > 0,
                redirectPath: event.entryFee > 0 ? `/events/${event._id}/payment` : `/events/${event._id}/ticket`
            }
        });
    } catch (err) {
        console.error('Error registering for event:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to register for event',
            message: err.message
        });
    }
});

// View ticket for a registered user
router.get('/:id/ticket', isAuthenticated, isOwner, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).populate('organizer', 'fullName email').lean();
        
        if (!event) {
            return res.status(404).json({ 
                success: false,
                error: 'Event not found' 
            });
        }

        // Verify registration
        const attendee = (event.attendees || []).find(a => a.user.toString() === req.user._id.toString());
        if (!attendee) {
            return res.status(403).json({ 
                success: false,
                error: 'You are not registered for this event' 
            });
        }

        const ticket = {
            eventId: event._id,
            title: event.title,
            category: event.category,
            date: event.eventDate,
            startTime: event.startTime,
            endTime: event.endTime,
            venue: event.location?.venue,
            address: event.location?.address,
            city: event.location?.city,
            attendeeName: req.user.fullName,
            numberOfPets: attendee.numberOfPets || 1,
            specialRequirements: attendee.specialRequirements,
            registeredAt: attendee.registeredAt,
            organizerName: event.organizer?.fullName || 'Organizer',
            organizerEmail: event.organizer?.email,
            entryFee: event.entryFee,
            formattedDate: new Date(event.eventDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        return res.json({
            success: true,
            data: {
                ticket,
                user: req.user
            }
        });
    } catch (err) {
        console.error('Get ticket error:', err);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to load ticket',
            message: err.message 
        });
    }
});

// Get event payment page data
router.get('/:id/payment', isAuthenticated, isOwner, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).lean();
        
        if (!event) {
            return res.status(404).json({ 
                success: false,
                error: 'Event not found' 
            });
        }

        // Ensure user is registered before paying
        const isRegistered = event.attendees && event.attendees.some(a => a.user.toString() === req.user._id.toString());
        if (!isRegistered) {
            return res.status(403).json({ 
                success: false,
                error: 'Register for the event first',
                redirectPath: `/events/${eventId}`
            });
        }

        const wallet = await Wallet.findOne({ user: req.user._id });
        
        res.json({
            success: true,
            data: {
                event: {
                    _id: event._id,
                    title: event.title,
                    entryFee: event.entryFee,
                    eventDate: event.eventDate,
                    location: event.location
                },
                wallet: wallet ? {
                    balance: wallet.balance
                } : {
                    balance: 0
                },
                user: req.user
            }
        });
    } catch (err) {
        console.error('Event payment page error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Failed to load payment page',
            message: err.message 
        });
    }
});

// Handle event payment (wallet, UPI, credit card)
router.post('/:id/pay', isAuthenticated, isOwner, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                error: 'Event not found' 
            });
        }

        const isRegistered = event.attendees && event.attendees.some(a => a.user.toString() === req.user._id.toString());
        if (!isRegistered) {
            return res.status(403).json({ 
                success: false, 
                error: 'Register for the event first' 
            });
        }

        const amount = event.entryFee || 0;
        const { paymentMethod, details } = req.body || {};

        // Support wallet, upi, and credit-card methods
        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ user: req.user._id });
            if (!wallet) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Wallet not found' 
                });
            }
            if (amount > 0) {
                if (wallet.balance < amount) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Insufficient wallet balance',
                        required: amount,
                        available: wallet.balance
                    });
                }
                await wallet.deductFunds(amount);
            }
        } else if (paymentMethod === 'upi') {
            // Basic UPI validation
            const upiId = details && details.upiId ? String(details.upiId).trim() : '';
            const upiRegex = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
            if (!upiRegex.test(upiId)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid UPI ID' 
                });
            }
            // Assume external UPI success for this implementation
        } else if (paymentMethod === 'credit-card') {
            // Basic card validation (format only)
            const name = details && details.cardName ? String(details.cardName).trim() : '';
            const number = details && details.cardNumber ? String(details.cardNumber).replace(/\s+/g, '') : '';
            const expiry = details && details.expiryDate ? String(details.expiryDate).trim() : '';
            const cvv = details && details.cvv ? String(details.cvv).trim() : '';
            const numRegex = /^\d{13,19}$/;
            const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
            const cvvRegex = /^\d{3,4}$/;
            if (!name || !numRegex.test(number) || !expRegex.test(expiry) || !cvvRegex.test(cvv)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid card details' 
                });
            }
            // Assume external card success for this implementation
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Unsupported payment method',
                supportedMethods: ['wallet', 'upi', 'credit-card']
            });
        }

        return res.json({ 
            success: true, 
            message: 'Payment successful',
            data: {
                redirectPath: `/events/${eventId}/ticket`,
                paymentMethod,
                amount
            }
        });
    } catch (err) {
        console.error('Event payment error:', err);
        return res.status(500).json({ 
            success: false, 
            error: 'Payment failed',
            message: err.message 
        });
    }
});

// Unregister from event
router.delete('/:id/unregister', isAuthenticated, async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        // Check if user is registered
        const isRegistered = event.isUserRegistered(req.user._id);
        if (!isRegistered) {
            return res.status(400).json({
                success: false,
                error: 'You are not registered for this event'
            });
        }

        // Remove attendee
        event.attendees = event.attendees.filter(
            attendee => attendee.user.toString() !== req.user._id.toString()
        );

        await event.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unregistered from event',
            data: {
                availableSlots: event.maxAttendees - event.attendees.length
            }
        });
    } catch (err) {
        console.error('Error unregistering from event:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to unregister from event',
            message: err.message
        });
    }
});

// Get my events (registered events)
router.get('/my/registered', isAuthenticated, async (req, res) => {
    try {
        const events = await Event.find({
            'attendees.user': req.user._id,
            eventDate: { $gte: new Date() }
        })
            .populate('organizer', 'fullName')
            .sort({ eventDate: 1 });

        const eventsWithDetails = events.map(event => {
            const attendee = event.attendees.find(a => a.user.toString() === req.user._id.toString());
            return {
                _id: event._id,
                title: event.title,
                description: event.description,
                category: event.category,
                eventDate: event.eventDate,
                startTime: event.startTime,
                endTime: event.endTime,
                location: event.location,
                entryFee: event.entryFee,
                organizer: event.organizer,
                status: event.status,
                myRegistration: {
                    numberOfPets: attendee?.numberOfPets,
                    specialRequirements: attendee?.specialRequirements,
                    registeredAt: attendee?.registeredAt
                },
                formattedDate: new Date(event.eventDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })
            };
        });

        res.json({
            success: true,
            data: {
                events: eventsWithDetails,
                total: eventsWithDetails.length
            }
        });
    } catch (err) {
        console.error('Error fetching my events:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to load your events',
            message: err.message
        });
    }
});

module.exports = router;