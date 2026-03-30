const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/reviews');
const User = require('../models/users');
const Wallet = require('../models/wallet');
const Availability = require('../models/availability');

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.user) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirectPath: '/login'
    });
}

// Middleware to check if user is a service provider
function isServiceProvider(req, res, next) {
    if (req.user && req.user.role === 'service_provider') {
        return next();
    }
    res.status(403).json({
        success: false,
        error: 'Access denied. Service providers only.'
    });
}

/**
 * @swagger
 * /api/service-provider/dashboard:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get service provider dashboard data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data including bookings, reviews, and statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: object
 *                     statistics:
 *                       type: object
 *                     bookings:
 *                       type: object
 *                     recentReviews:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Service providers only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get service provider dashboard data
router.get('/dashboard', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const serviceProviderId = req.user._id;
        
        // Use current date or a specific date for testing
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];

        console.log('Service Provider Dashboard - Provider ID:', serviceProviderId);
        console.log('Today\'s date:', todayFormatted);

        // The 'service' field in Booking refers directly to the User (service provider)
        // So we query bookings where service equals the service provider's ID
        
        // Fetch ALL bookings first to see what's there
        const allBookings = await Booking.find({
            service: serviceProviderId
        }).lean();
        console.log(`Found ${allBookings.length} total bookings for this service provider`);
        if (allBookings.length > 0) {
            console.log('Sample booking dates:', allBookings.slice(0, 3).map(b => ({ date: b.date, slot: b.slot })));
        }

        // Fetch future bookings (including today)
        const futureBookings = await Booking.find({
            service: serviceProviderId,
            date: { $gte: todayFormatted }
        })
        .populate('user', 'fullName username email phoneNo')
        .sort({ date: 1, slot: 1 })
        .lean();

        console.log(`Found ${futureBookings.length} future bookings (including today)`);

        // Fetch past bookings (excluding today)
        const pastBookings = await Booking.find({
            service: serviceProviderId,
            date: { $lt: todayFormatted }
        })
        .populate('user', 'fullName username email phoneNo')
        .sort({ date: -1, slot: -1 })
        .lean();

        console.log(`Found ${pastBookings.length} past bookings (excluding today)`);

        // Fetch today's bookings separately
        const todayBookings = await Booking.find({
            service: serviceProviderId,
            date: todayFormatted
        })
        .populate('user', 'fullName username email phoneNo')
        .sort({ slot: 1 })
        .lean();

        console.log(`Found ${todayBookings.length} today's bookings`);

        // Get review statistics
        const reviews = await Review.find({
            targetType: 'ServiceProvider',
            targetId: serviceProviderId
        })
        .populate('user', 'fullName username')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
            : 0;

        // Calculate rating distribution
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const allReviews = await Review.find({
            targetType: 'ServiceProvider',
            targetId: serviceProviderId
        }).select('rating').lean();
        
        allReviews.forEach(review => {
            if (ratingDistribution.hasOwnProperty(review.rating)) {
                ratingDistribution[review.rating]++;
            }
        });

        // Calculate total bookings and revenue statistics (reuse allBookings from above)
        const totalBookings = allBookings.length;
        const completedBookings = allBookings.filter(b => 
            b.date < todayFormatted
        ).length;
        const upcomingBookings = futureBookings.length;

        // Get wallet balance
        const wallet = await Wallet.findOne({ user: serviceProviderId });
        const walletBalance = wallet ? wallet.balance : 0;

        // Calculate estimated revenue (you can adjust pricing logic)
        const estimatedRevenue = completedBookings * 500; // Example: ₹500 per booking

        // Format bookings for response
        const formatBooking = (booking) => ({
            _id: booking._id,
            date: booking.date,
            slot: booking.slot,
            time: booking.slot, // Include both for backward compatibility
            status: booking.status || 'confirmed',
            customer: {
                _id: booking.user?._id,
                name: booking.user?.fullName || booking.user?.username || 'Customer',
                email: booking.user?.email,
                phone: booking.user?.phoneNo || booking.user?.phone
            },
            createdAt: booking.createdAt,
            notes: booking.notes || ''
        });

        const formattedFutureBookings = futureBookings.map(formatBooking);
        const formattedPastBookings = pastBookings.map(formatBooking);
        const formattedTodayBookings = todayBookings.map(formatBooking);

        // Format reviews
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            user: {
                _id: review.user?._id,
                name: review.user?.fullName || review.user?.username || 'Customer'
            },
            createdAt: review.createdAt,
            reply: review.reply
        }));

        res.json({
            success: true,
            data: {
                provider: {
                    _id: req.user._id,
                    name: req.user.fullName || 'Service Provider',
                    serviceType: req.user.serviceType,
                    serviceAddress: req.user.serviceAddress,
                    email: req.user.email,
                    phoneNo: req.user.phoneNo,
                    experienceYears: req.user.experienceYears,
                    profilePicture: req.user.profilePicture 
                        ? `/images/user/${req.user._id}/profile` 
                        : null
                },
                statistics: {
                    totalBookings,
                    completedBookings,
                    upcomingBookings,
                    todayBookings: todayBookings.length,
                    totalReviews: allReviews.length,
                    averageRating: parseFloat(averageRating.toFixed(1)),
                    ratingDistribution,
                    walletBalance: walletBalance.toFixed(2),
                    estimatedRevenue: estimatedRevenue.toFixed(2)
                },
                bookings: {
                    today: formattedTodayBookings,
                    upcoming: formattedFutureBookings,
                    past: formattedPastBookings
                },
                recentReviews: formattedReviews
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error loading dashboard',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-provider/bookings:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get all bookings with optional filters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, past, today, all]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get all bookings with filters
router.get('/bookings', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;
        
        // The 'service' field in Booking refers directly to the User (service provider)
        let query = { service: req.user._id };
        
        // Filter by status
        if (status === 'upcoming') {
            const today = new Date().toISOString().split('T')[0];
            query.date = { $gt: today };
        } else if (status === 'past') {
            const today = new Date().toISOString().split('T')[0];
            query.date = { $lte: today };
        } else if (status === 'today') {
            const today = new Date().toISOString().split('T')[0];
            query.date = today;
        }
        
        // Filter by specific date
        if (date) {
            query.date = date;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Booking.countDocuments(query);

        const bookings = await Booking.find(query)
            .populate('user', 'fullName username email phoneNo phone')
            .sort({ date: -1, slot: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            date: booking.date,
            slot: booking.slot,
            time: booking.slot, // Include both for backward compatibility
            status: booking.status || 'confirmed',
            customer: {
                _id: booking.user?._id,
                name: booking.user?.fullName || booking.user?.username || 'Customer',
                email: booking.user?.email,
                phone: booking.user?.phoneNo || booking.user?.phone
            },
            createdAt: booking.createdAt,
            notes: booking.notes || ''
        }));

        res.json({
            success: true,
            data: {
                bookings: formattedBookings,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    status: status || 'all',
                    date: date || null
                }
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching bookings',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-provider/bookings/{bookingId}:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get a single booking's details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       type: object
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get single booking details
router.get('/bookings/:bookingId', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        // The 'service' field in Booking refers directly to the User (service provider)
        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            service: req.user._id
        })
        .populate('user', 'fullName username email phoneNo address')
        .populate('service', 'serviceType description rate')
        .lean();

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const formattedBooking = {
            _id: booking._id,
            date: booking.date,
            slot: booking.slot,
            time: booking.slot, // Include both for backward compatibility
            status: booking.status || 'confirmed',
            customer: {
                _id: booking.user?._id,
                name: booking.user?.fullName || booking.user?.username || 'Customer',
                email: booking.user?.email,
                phone: booking.user?.phoneNo || booking.user?.phone,
                address: booking.user?.address
            },
            notes: booking.notes || '',
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        };

        res.json({
            success: true,
            data: {
                booking: formattedBooking
            }
        });
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching booking details',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-provider/bookings/{bookingId}/status:
 *   patch:
 *     tags: [ServiceProvider]
 *     summary: Update a booking's status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Update booking status
router.patch('/bookings/:bookingId/status', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const { status } = req.body;
        
        // The 'service' field in Booking refers directly to the User (service provider)
        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            service: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Validate status
        const validStatuses = ['confirmed', 'completed', 'cancelled', 'no-show'];
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
                bookingId: booking._id,
                status: booking.status
            }
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating booking status',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-provider/profile:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get service provider profile details
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Provider profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get service provider profile
router.get('/profile', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const provider = await User.findById(req.user._id)
            .select('-password')
            .lean();
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                error: 'Service provider not found'
            });
        }

        // Get wallet info
        const wallet = await Wallet.findOne({ user: provider._id });

        // Get service statistics (service field refers to service provider user ID)
        const totalBookings = await Booking.countDocuments({ service: provider._id });
        const reviews = await Review.find({
            targetType: 'ServiceProvider',
            targetId: provider._id
        });
        
        const averageRating = reviews.length > 0 
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
            : 0;

        res.json({
            success: true,
            data: {
                provider: {
                    _id: provider._id,
                    fullName: provider.fullName,
                    email: provider.email,
                    phoneNo: provider.phoneNo,
                    serviceType: provider.serviceType,
                    serviceAddress: provider.serviceAddress,
                    serviceDescription: provider.serviceDescription,
                    experienceYears: provider.experienceYears,
                    availability: provider.availability,
                    profilePicture: provider.profilePicture 
                        ? `/images/user/${provider._id}/profile` 
                        : null,
                    walletBalance: wallet ? wallet.balance.toFixed(2) : '0.00',
                    statistics: {
                        totalBookings,
                        averageRating: parseFloat(averageRating.toFixed(1)),
                        totalReviews: reviews.length
                    },
                    createdAt: provider.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Error fetching provider profile:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching provider profile',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-provider/profile:
 *   patch:
 *     tags: [ServiceProvider]
 *     summary: Update service provider profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceType:
 *                 type: string
 *               serviceAddress:
 *                 type: string
 *               serviceDescription:
 *                 type: string
 *               experienceYears:
 *                 type: integer
 *               availability:
 *                 type: string
 *               phoneNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid update fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Update service provider profile
router.patch('/profile', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const allowedUpdates = [
            'serviceType', 
            'serviceAddress', 
            'serviceDescription', 
            'experienceYears',
            'availability',
            'phoneNo'
        ];
        
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({
                success: false,
                error: 'Invalid updates',
                allowedFields: allowedUpdates
            });
        }

        const provider = await User.findById(req.user._id);
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                error: 'Service provider not found'
            });
        }

        updates.forEach(update => provider[update] = req.body[update]);
        await provider.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                provider: {
                    _id: provider._id,
                    fullName: provider.fullName,
                    serviceType: provider.serviceType,
                    serviceAddress: provider.serviceAddress,
                    serviceDescription: provider.serviceDescription,
                    experienceYears: provider.experienceYears,
                    availability: provider.availability,
                    phoneNo: provider.phoneNo
                }
            }
        });
    } catch (error) {
        console.error('Error updating provider profile:', error);
        res.status(400).json({
            success: false,
            error: 'Error updating provider profile',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/service-provider/analytics:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get analytics and statistics for the service provider
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingsByDate:
 *                       type: array
 *                     statusDistribution:
 *                       type: array
 *                     monthlyRevenue:
 *                       type: array
 */
// Get analytics/statistics
router.get('/analytics', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Bookings over time (service field refers to service provider user ID)
        const bookingsByDate = await Booking.aggregate([
            {
                $match: {
                    service: req.user._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Booking status distribution
        const statusDistribution = await Booking.aggregate([
            { $match: { service: req.user._id } },
            { 
                $group: { 
                    _id: '$status', 
                    count: { $sum: 1 } 
                } 
            }
        ]);

        // Monthly revenue trend (assuming ₹500 per booking)
        const monthlyRevenue = await Booking.aggregate([
            {
                $match: {
                    service: req.user._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    bookings: { $sum: 1 },
                    revenue: { $sum: 500 } // Adjust based on your pricing
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                period: parseInt(period),
                bookingsByDate,
                statusDistribution,
                monthlyRevenue,
                startDate
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching analytics',
            message: error.message
        });
    }
});

// ===== AVAILABILITY MANAGEMENT ROUTES =====

/**
 * @swagger
 * /api/service-provider/availability:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get the provider's weekly schedule and blocked dates
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Availability data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     days:
 *                       type: array
 *                     blockedDates:
 *                       type: array
 */
// GET /api/service-provider/availability — fetch current schedule + blocked dates
router.get('/availability', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const avail = await Availability.findOne({ serviceProvider: req.user._id }).lean();
        res.json({ success: true, data: avail || { days: [], blockedDates: [] } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/service-provider/availability:
 *   post:
 *     tags: [ServiceProvider]
 *     summary: Save the provider's weekly day schedule
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [days]
 *             properties:
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Schedule saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// POST /api/service-provider/availability — save weekly day schedule
router.post('/availability', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const { days } = req.body;
        if (!Array.isArray(days)) {
            return res.status(400).json({ success: false, error: 'days must be an array' });
        }
        const avail = await Availability.findOneAndUpdate(
            { serviceProvider: req.user._id },
            { $set: { days, updatedAt: Date.now() } },
            { upsert: true, new: true, runValidators: true }
        );
        res.json({ success: true, message: 'Schedule saved successfully', data: avail });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/service-provider/availability/block-date:
 *   post:
 *     tags: [ServiceProvider]
 *     summary: Add a blocked date to the provider's schedule
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-20"
 *     responses:
 *       200:
 *         description: Date blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// POST /api/service-provider/availability/block-date — add a blocked date
router.post('/availability/block-date', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const { date } = req.body;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, error: 'Valid date (YYYY-MM-DD) is required' });
        }
        const avail = await Availability.findOneAndUpdate(
            { serviceProvider: req.user._id },
            { $addToSet: { blockedDates: date }, $set: { updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: `${date} blocked successfully`, data: avail });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /api/service-provider/availability/block-date/{date}:
 *   delete:
 *     tags: [ServiceProvider]
 *     summary: Remove a blocked date from the provider's schedule
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Date unblocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// DELETE /api/service-provider/availability/block-date/:date — remove a blocked date
router.delete('/availability/block-date/:date', isAuthenticated, isServiceProvider, async (req, res) => {
    try {
        const { date } = req.params;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, error: 'Valid date (YYYY-MM-DD) is required' });
        }
        const avail = await Availability.findOneAndUpdate(
            { serviceProvider: req.user._id },
            { $pull: { blockedDates: date }, $set: { updatedAt: Date.now() } },
            { new: true }
        );
        res.json({ success: true, message: `${date} unblocked successfully`, data: avail });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;