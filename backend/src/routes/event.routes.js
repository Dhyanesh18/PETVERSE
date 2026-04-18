const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const Transaction = require('../models/transaction');
const PaymentIntent = require('../models/paymentIntent');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { refundRazorpayPayment, toPaise } = require('../utils/razorpay');
const { syncEvent, deleteEvent: deleteEventFromTypesense } = require('../utils/typesense');
const multer = require('multer');
const path = require('path');

// Configure multer for document uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: function (req, file, callback) {
        const ext = path.extname(file.originalname).toLowerCase();
        
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
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

/**
 * @swagger
 * /api/events:
 *   get:
 *     tags: [Events]
 *     summary: Get all upcoming events with optional filters
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by event category
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name (case-insensitive)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events on a specific date (YYYY-MM-DD)
 *       - in: query
 *         name: feeType
 *         schema:
 *           type: string
 *           enum: [free, paid]
 *         description: Filter by free or paid events
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword search on title, description and tags
 *     responses:
 *       200:
 *         description: List of events with available slot info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', async (req, res) => {
    try {
        const { category, city, date, feeType, search } = req.query;

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

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get full details of a single event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *     responses:
 *       200:
 *         description: Event details with registration status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/events/add:
 *   post:
 *     tags: [Events]
 *     summary: Create a new event (service providers only, requires permission document)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, category, eventDate, startTime, endTime, venue, address, city, maxAttendees, permissionDocument]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *               venue:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               entryFee:
 *                 type: number
 *                 default: 0
 *               maxAttendees:
 *                 type: integer
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               contactPhone:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               permissionDocument:
 *                 type: string
 *                 format: binary
 *                 description: Government permission letter (PDF/image, max 10MB)
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or missing permission document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Only service providers can create events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        if (new Date(eventDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Event date must be in the future'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Government permission letter is required'
            });
        }

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
        syncEvent(newEvent).catch(() => {}); // fire-and-forget Typesense sync

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

/**
 * @swagger
 * /api/events/my/organized:
 *   get:
 *     tags: [Events]
 *     summary: Get all events organised by the logged-in service provider
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of organised events with attendee stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Service providers only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/events/register:
 *   post:
 *     tags: [Events]
 *     summary: Register for an event (pet owners only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId:
 *                 type: string
 *               numberOfPets:
 *                 type: integer
 *                 default: 1
 *               specialRequirements:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Event full or already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Only pet owners can register
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({
                success: false,
                error: 'Event is full'
            });
        }

        if (event.isUserRegistered(req.user._id)) {
            return res.status(400).json({
                success: false,
                error: 'You are already registered for this event'
            });
        }

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

/**
 * @swagger
 * /api/events/{id}/ticket:
 *   get:
 *     tags: [Events]
 *     summary: Get ticket details for a registered event (pet owners only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Not registered for this event or not an owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        const attendee = (event.attendees || []).find(a => a.user.toString() === req.user._id.toString());
        if (!attendee) {
            return res.status(403).json({ 
                success: false,
                error: 'You are not registered for this event' 
            });
        }

        // For paid events, require payment before issuing ticket
        if ((event.entryFee || 0) > 0 && !attendee.isPaid) {
            return res.status(403).json({
                success: false,
                error: 'Payment required for this event',
                redirectPath: `/events/${eventId}/payment`
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
            payment: {
                provider: attendee.paymentProvider || null,
                intentId: attendee.paymentIntentId ? String(attendee.paymentIntentId) : null,
                isPaid: !!attendee.isPaid
            },
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

/**
 * @swagger
 * /api/events/{id}/payment:
 *   get:
 *     tags: [Events]
 *     summary: Get payment page data for a paid event (pet owners only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *     responses:
 *       200:
 *         description: Event payment info and wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Must register before paying
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/events/{id}/pay:
 *   post:
 *     tags: [Events]
 *     summary: Pay entry fee for a registered event (pet owners only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, upi, credit-card]
 *               details:
 *                 type: object
 *                 description: Payment details (UPI ID or card info)
 *                 properties:
 *                   upiId:
 *                     type: string
 *                     example: "user@upi"
 *                   cardName:
 *                     type: string
 *                   cardNumber:
 *                     type: string
 *                   expiryDate:
 *                     type: string
 *                     example: "12/26"
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Unsupported method, insufficient balance, or invalid details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Must register before paying
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        const attendeeIndex = (event.attendees || []).findIndex(a => a.user.toString() === req.user._id.toString());
        if (attendeeIndex === -1) {
            return res.status(403).json({ 
                success: false, 
                error: 'Register for the event first' 
            });
        }

        // If already paid, just redirect to ticket
        if ((event.entryFee || 0) > 0 && event.attendees[attendeeIndex]?.isPaid) {
            return res.json({
                success: true,
                message: 'Already paid',
                data: { redirectPath: `/events/${eventId}/ticket` }
            });
        }

        const amount = event.entryFee || 0;
        const { paymentMethod, details } = req.body || {};

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

                // Credit organizer wallet (best-effort)
                let organizerWallet = await Wallet.findOne({ user: event.organizer });
                if (!organizerWallet) {
                    organizerWallet = new Wallet({ user: event.organizer, balance: 0 });
                    await organizerWallet.save();
                }
                await organizerWallet.addFunds(amount);

                await new Transaction({
                    from: req.user._id,
                    to: event.organizer,
                    amount: amount,
                    type: 'event_payment',
                    description: `Event entry fee: ${event.title}`
                }).save();
            }

            event.attendees[attendeeIndex].isPaid = true;
            event.attendees[attendeeIndex].paidAt = new Date();
            event.attendees[attendeeIndex].paymentProvider = 'wallet';
            event.attendees[attendeeIndex].paymentIntentId = null;
            await event.save();

            return res.json({ 
                success: true, 
                message: 'Payment successful',
                data: {
                    redirectPath: `/events/${eventId}/ticket`,
                    paymentMethod,
                    amount
                }
            });
        } else if (paymentMethod === 'upi') {
            // Use Razorpay Checkout for real payments
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            const currency = process.env.RAZORPAY_CURRENCY || 'INR';

            if (!keyId || !keySecret) {
                return res.status(500).json({
                    success: false,
                    error: 'Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)'
                });
            }

            const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
            const amountPaise = Math.round(parseFloat(amount) * 100);

            const intent = await PaymentIntent.create({
                user: req.user._id,
                purpose: 'event_entry_fee',
                amount: parseFloat(amount),
                currency,
                status: 'created',
                provider: 'razorpay',
                metadata: {
                    eventId: String(event._id),
                    paymentMethod
                }
            });

            const rzpOrder = await razorpay.orders.create({
                amount: amountPaise,
                currency,
                receipt: String(intent._id),
                notes: {
                    intentId: String(intent._id),
                    purpose: 'event_entry_fee',
                    eventId: String(event._id)
                }
            });

            intent.providerOrderId = rzpOrder.id;
            await intent.save();

            return res.json({
                success: true,
                message: 'Razorpay order created',
                data: {
                    intentId: String(intent._id),
                    razorpayOrderId: rzpOrder.id,
                    amountPaise,
                    currency,
                    keyId,
                    customer: {
                        name: req.user.fullName || req.user.username || '',
                        email: req.user.email || '',
                        contact: req.user.phone || ''
                    }
                }
            });
        } else if (paymentMethod === 'credit-card') {
            // Use Razorpay Checkout for real payments
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            const currency = process.env.RAZORPAY_CURRENCY || 'INR';

            if (!keyId || !keySecret) {
                return res.status(500).json({
                    success: false,
                    error: 'Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)'
                });
            }

            const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
            const amountPaise = Math.round(parseFloat(amount) * 100);

            const intent = await PaymentIntent.create({
                user: req.user._id,
                purpose: 'event_entry_fee',
                amount: parseFloat(amount),
                currency,
                status: 'created',
                provider: 'razorpay',
                metadata: {
                    eventId: String(event._id),
                    paymentMethod
                }
            });

            const rzpOrder = await razorpay.orders.create({
                amount: amountPaise,
                currency,
                receipt: String(intent._id),
                notes: {
                    intentId: String(intent._id),
                    purpose: 'event_entry_fee',
                    eventId: String(event._id)
                }
            });

            intent.providerOrderId = rzpOrder.id;
            await intent.save();

            return res.json({
                success: true,
                message: 'Razorpay order created',
                data: {
                    intentId: String(intent._id),
                    razorpayOrderId: rzpOrder.id,
                    amountPaise,
                    currency,
                    keyId,
                    customer: {
                        name: req.user.fullName || req.user.username || '',
                        email: req.user.email || '',
                        contact: req.user.phone || ''
                    }
                }
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Unsupported payment method',
                supportedMethods: ['wallet', 'upi', 'credit-card']
            });
        }
    } catch (err) {
        console.error('Event payment error:', err);
        return res.status(500).json({ 
            success: false, 
            error: 'Payment failed',
            message: err.message 
        });
    }
});

// Verify Razorpay payment for event entry fee
router.post('/:id/razorpay/verify', isAuthenticated, isOwner, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { intentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            return res.status(500).json({
                success: false,
                error: 'Razorpay is not configured (missing RAZORPAY_KEY_SECRET)'
            });
        }

        if (!intentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing verification parameters'
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const attendeeIndex = (event.attendees || []).findIndex(a => a.user.toString() === req.user._id.toString());
        if (attendeeIndex === -1) {
            return res.status(403).json({
                success: false,
                error: 'Register for the event first'
            });
        }

        if ((event.entryFee || 0) > 0 && event.attendees[attendeeIndex]?.isPaid) {
            return res.json({
                success: true,
                message: 'Already paid',
                data: { redirectPath: `/events/${eventId}/ticket` }
            });
        }

        const intent = await PaymentIntent.findById(intentId);
        if (!intent || intent.user.toString() !== req.user._id.toString() || intent.purpose !== 'event_entry_fee') {
            return res.status(404).json({
                success: false,
                error: 'Payment intent not found'
            });
        }

        if (String(intent.metadata?.eventId || '') !== String(event._id)) {
            return res.status(400).json({
                success: false,
                error: 'Intent does not match event'
            });
        }

        if (intent.providerOrderId && intent.providerOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                error: 'Order mismatch'
            });
        }

        const expected = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expected !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment signature'
            });
        }

        // Credit organizer wallet (best-effort)
        let organizerWallet = await Wallet.findOne({ user: event.organizer });
        if (!organizerWallet) {
            organizerWallet = new Wallet({ user: event.organizer, balance: 0 });
            await organizerWallet.save();
        }
        await organizerWallet.addFunds(intent.amount);

        await new Transaction({
            from: req.user._id,
            to: event.organizer,
            amount: intent.amount,
            type: 'event_payment',
            description: `Event entry fee: ${event.title}`
        }).save();

        event.attendees[attendeeIndex].isPaid = true;
        event.attendees[attendeeIndex].paidAt = new Date();
        event.attendees[attendeeIndex].paymentProvider = 'razorpay';
        event.attendees[attendeeIndex].paymentIntentId = intent._id;
        await event.save();

        intent.status = 'paid';
        intent.providerOrderId = razorpay_order_id;
        intent.providerPaymentId = razorpay_payment_id;
        intent.providerSignature = razorpay_signature;
        await intent.save();

        return res.json({
            success: true,
            message: 'Payment verified',
            data: {
                redirectPath: `/events/${eventId}/ticket`
            }
        });
    } catch (err) {
        console.error('Event Razorpay verify error:', err);
        return res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: err.message
        });
    }
});

// Cancel Razorpay event payment (best-effort)
router.post('/:id/razorpay/cancel', isAuthenticated, isOwner, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { intentId } = req.body || {};

        if (!intentId) {
            return res.status(400).json({
                success: false,
                error: 'intentId is required'
            });
        }

        const intent = await PaymentIntent.findById(intentId);
        if (!intent || intent.user.toString() !== req.user._id.toString() || intent.purpose !== 'event_entry_fee') {
            return res.status(404).json({
                success: false,
                error: 'Payment intent not found'
            });
        }

        if (String(intent.metadata?.eventId || '') !== String(eventId)) {
            return res.status(400).json({
                success: false,
                error: 'Intent does not match event'
            });
        }

        if (intent.status === 'paid') {
            return res.json({
                success: true,
                message: 'Payment already completed'
            });
        }

        intent.status = 'cancelled';
        await intent.save();

        return res.json({
            success: true,
            message: 'Cancelled'
        });
    } catch (err) {
        console.error('Event Razorpay cancel error:', err);
        return res.status(500).json({
            success: false,
            error: 'Cancel failed',
            message: err.message
        });
    }
});

// Refund Razorpay event entry fee (refund to original payment method)
router.post('/:id/razorpay/refund', isAuthenticated, isOwner, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { intentId } = req.body || {};

        if (!intentId) {
            return res.status(400).json({
                success: false,
                error: 'intentId is required'
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const attendeeIndex = (event.attendees || []).findIndex(a => a.user.toString() === req.user._id.toString());
        if (attendeeIndex === -1) {
            return res.status(403).json({
                success: false,
                error: 'Not registered for this event'
            });
        }

        const intent = await PaymentIntent.findById(intentId);
        if (!intent || intent.user.toString() !== req.user._id.toString() || intent.purpose !== 'event_entry_fee') {
            return res.status(404).json({
                success: false,
                error: 'Payment intent not found'
            });
        }

        if (String(intent.metadata?.eventId || '') !== String(event._id)) {
            return res.status(400).json({
                success: false,
                error: 'Intent does not match event'
            });
        }

        if (intent.status === 'refunded') {
            return res.json({
                success: true,
                message: 'Already refunded',
                data: {
                    intentId: String(intent._id),
                    refundId: intent.providerRefundId || null,
                    refundStatus: intent.providerRefundStatus || null
                }
            });
        }

        if (intent.status !== 'paid' || !intent.providerPaymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment is not completed or missing payment reference'
            });
        }

        // Ensure attendee is currently marked paid
        if (!event.attendees[attendeeIndex]?.isPaid) {
            return res.status(400).json({
                success: false,
                error: 'Attendee is not marked as paid'
            });
        }

        // Reverse organizer wallet credit (best-effort safeguard)
        let organizerWallet = await Wallet.findOne({ user: event.organizer });
        if (!organizerWallet) {
            organizerWallet = new Wallet({ user: event.organizer, balance: 0 });
            await organizerWallet.save();
        }

        if (organizerWallet.balance < intent.amount) {
            return res.status(400).json({
                success: false,
                error: 'Organizer has insufficient wallet balance to process refund'
            });
        }

        const refund = await refundRazorpayPayment({
            paymentId: intent.providerPaymentId,
            amountPaise: toPaise(intent.amount),
            notes: {
                intentId: String(intent._id),
                purpose: 'event_entry_fee',
                eventId: String(event._id),
                userId: String(req.user._id)
            },
            receipt: String(intent._id)
        });

        if (refund.status === 'failed') {
            return res.status(500).json({
                success: false,
                error: 'Refund failed',
                message: 'Razorpay returned a failed refund status'
            });
        }

        await organizerWallet.deductFunds(intent.amount);

        await new Transaction({
            from: event.organizer,
            to: req.user._id,
            amount: intent.amount,
            type: 'refund',
            description: `Event entry fee refunded to original payment method (Razorpay): ${event.title}`
        }).save();

        // Mark attendee as unpaid so ticket access is blocked again
        event.attendees[attendeeIndex].isPaid = false;
        event.attendees[attendeeIndex].paidAt = null;
        event.attendees[attendeeIndex].paymentProvider = null;
        event.attendees[attendeeIndex].paymentIntentId = null;
        await event.save();

        intent.status = 'refunded';
        intent.providerRefundId = refund.id;
        intent.providerRefundStatus = refund.status;
        intent.refundedAt = refund.created_at ? new Date(refund.created_at * 1000) : new Date();
        await intent.save();

        return res.json({
            success: true,
            message: 'Refund initiated',
            data: {
                intentId: String(intent._id),
                refundId: refund.id,
                refundStatus: refund.status,
                redirectPath: `/events/${eventId}`
            }
        });
    } catch (err) {
        console.error('Event Razorpay refund error:', err);
        return res.status(500).json({
            success: false,
            error: 'Refund failed',
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/events/{id}/unregister:
 *   delete:
 *     tags: [Events]
 *     summary: Unregister from an event
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ObjectId
 *     responses:
 *       200:
 *         description: Successfully unregistered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Not registered for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

        const isRegistered = event.isUserRegistered(req.user._id);
        if (!isRegistered) {
            return res.status(400).json({
                success: false,
                error: 'You are not registered for this event'
            });
        }

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

/**
 * @swagger
 * /api/events/my/registered:
 *   get:
 *     tags: [Events]
 *     summary: Get all upcoming events the logged-in user is registered for
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of registered upcoming events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
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