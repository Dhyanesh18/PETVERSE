const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Review = require('../models/reviews');
const Wallet = require('../models/wallet');
const Transaction = require('../models/transaction');
const Booking = require('../models/Booking');

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

// Helper function to calculate service price
function calculateServicePrice(serviceType) {
    if (!serviceType) return 300;
    const type = serviceType.toLowerCase();
    if (type === 'veterinarian' || type === 'trainer') return 500;
    if (type === 'groomer') return 300;
    if (type === 'pet sitter' || type === 'breeder' || type === 'walking' || type === 'sitting') return 200;
    return 400;
}

// Helper function to map service type to category
function mapServiceCategory(serviceType) {
    if (!serviceType) return 'Pet Services';
    const categoryMap = {
        'veterinarian': 'Veterinary Doctor',
        'groomer': 'Pet Grooming',
        'trainer': 'Dog Training',
        'pet sitter': 'Pet Sitting',
        'breeder': 'Breeding Services',
        'walking': 'Dog Walking',
        'sitting': 'Pet Sitting'
    };
    return categoryMap[serviceType.toLowerCase()] || serviceType;
}

// Get all service providers with filters
router.get('/', async (req, res) => {
    try {
        const { 
            categories, 
            minPrice, 
            maxPrice, 
            minRating,
            location,
            page = 1,
            limit = 12,
            sortBy = 'rating'
        } = req.query;
        
        console.log('\n=== SERVICES API CALLED ===');
        
        let query = { role: 'service_provider' };
        
        // Filter by categories
        if (categories) {
            const categoryArray = categories.split(',').map(c => c.trim().toLowerCase());
            query.serviceType = { $in: categoryArray };
        }
        
        // Filter by location
        if (location) {
            query.serviceAddress = new RegExp(location, 'i');
        }
        
        const providers = await User.find(query).lean();
        console.log(`Found ${providers.length} service providers`);
        
        if (providers.length > 0) {
            console.log('Service providers:', providers.map(p => ({
                name: p.fullName,
                type: p.serviceType,
                address: p.serviceAddress
            })));
        }
        
        const validProviders = providers.map(p => ({
            ...p,
            serviceType: p.serviceType || 'pet sitter'
        }));
        console.log(`Processing ${validProviders.length} providers`);

        // Process providers with reviews
        const services = await Promise.all(validProviders.map(async (provider) => {
            try {
                const reviews = await Review.find({ 
                    targetType: 'ServiceProvider', 
                    targetId: provider._id 
                }).lean();
                
                const reviewCount = reviews.length;
                const avgRating = reviewCount > 0 
                    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount 
                    : 0;

                const topReviews = reviews.slice(0, 2).map(r => ({
                    rating: r.rating || 0,
                    comment: r.comment || '',
                    createdAt: r.createdAt,
                    userName: 'Customer'
                }));
                
                const serviceType = provider.serviceType || 'pet sitter';
                const price = calculateServicePrice(serviceType);
                const category = mapServiceCategory(serviceType);

                return {
                    _id: provider._id,
                    id: provider._id.toString(),
                    name: provider.fullName || provider.username || 'Service Provider',
                    fullName: provider.fullName || provider.username || 'Service Provider',
                    username: provider.username || 'provider',
                    email: provider.email || 'contact@petverse.com',
                    phone: provider.phoneNo || provider.phone || 'Not available',
                    phoneNo: provider.phoneNo || provider.phone || 'Not available',
                    serviceType: serviceType,
                    serviceAddress: provider.serviceAddress || 'Location not specified',
                    serviceDescription: provider.serviceDescription || 'Professional pet services provider.',
                    experienceYears: provider.experienceYears || 0,
                    isApproved: provider.isApproved !== false,
                    category: category,
                    rating: parseFloat(avgRating.toFixed(1)),
                    reviewCount: reviewCount,
                    price: price,
                    topReviews: topReviews,
                    profilePicture: null
                };
            } catch (providerError) {
                console.error(`Error processing provider ${provider._id}:`, providerError.message);
                return null;
            }
        }));
        
        // Filter out any null values from errors
        let validServices = services.filter(s => s !== null);

        // Apply price filters
        if (minPrice) {
            const min = parseFloat(minPrice);
            validServices = validServices.filter(s => s.price >= min);
        }
        
        if (maxPrice) {
            const max = parseFloat(maxPrice);
            validServices = validServices.filter(s => s.price <= max);
        }
        
        // Apply rating filter
        if (minRating) {
            const rating = parseFloat(minRating);
            validServices = validServices.filter(s => s.rating >= rating);
        }

        // Sort services
        if (sortBy === 'rating') {
            validServices.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'price-low') {
            validServices.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
            validServices.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'reviews') {
            validServices.sort((a, b) => b.reviewCount - a.reviewCount);
        }

        // Pagination
        const total = validServices.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedServices = validServices.slice(skip, skip + parseInt(limit));

        console.log(`Returning ${paginatedServices.length} services out of ${total} total\n`);
        
        res.json({
            success: true,
            data: {
                services: paginatedServices,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    categories: categories || null,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    minRating: minRating || null,
                    location: location || null,
                    sortBy: sortBy || 'rating'
                }
            }
        });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading services',
            message: err.message
        });
    }
});

// Get filter options (categories)
router.get('/filter-options', async (req, res) => {
    try {
        // Get distinct service types
        const distinctTypes = await User.distinct('serviceType', { 
            role: 'service_provider',
            serviceType: { $exists: true, $ne: null, $ne: '' }
        });
        
        const categories = distinctTypes
            .filter(type => type)
            .map(type => ({
                value: type.toLowerCase(),
                label: mapServiceCategory(type),
                price: calculateServicePrice(type)
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        res.json({
            success: true,
            data: {
                categories,
                sortOptions: [
                    { value: 'rating', label: 'Highest Rated' },
                    { value: 'reviews', label: 'Most Reviews' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' }
                ]
            }
        });
    } catch (err) {
        console.error('Error fetching filter options:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching filter options',
            message: err.message
        });
    }
});

// Get breeder services only
router.get('/breeders', async (req, res) => {
    try {
        const { location, page = 1, limit = 12 } = req.query;
        
        let query = {
            role: 'service_provider',
            serviceType: 'breeder'
        };

        if (location) {
            query.serviceAddress = new RegExp(location, 'i');
        }

        const breeders = await User.find(query).lean();

        const services = await Promise.all(breeders.map(async (provider) => {
            const reviews = await Review.find({ 
                targetType: 'ServiceProvider', 
                targetId: provider._id 
            });
            
            const reviewCount = reviews.length;
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
            
            return {
                _id: provider._id,
                id: provider._id.toString(),
                name: provider.fullName || provider.username || 'Breeder',
                fullName: provider.fullName || provider.username || 'Breeder',
                email: provider.email,
                phone: provider.phoneNo || provider.phone,
                phoneNo: provider.phoneNo || provider.phone,
                serviceType: provider.serviceType,
                serviceAddress: provider.serviceAddress || 'Location not specified',
                serviceDescription: provider.serviceDescription || 'Professional breeding services',
                category: 'Breeding Services',
                rating: parseFloat(avgRating.toFixed(1)) || 0,
                reviewCount: reviewCount || 0,
                price: 200,
                profilePicture: provider.profilePicture 
                    ? `/images/user/${provider._id}/profile` 
                    : null
            };
        }));

        // Pagination
        const total = services.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedServices = services.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            data: {
                services: paginatedServices,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    location: location || null
                }
            }
        });
    } catch (error) {
        console.error('Error fetching breeder services:', error);
        res.status(500).json({
            success: false,
            error: 'Error loading breeder services',
            message: error.message
        });
    }
});

// Get single service provider details
router.get('/:id', async (req, res) => {
    try {
        const providerId = req.params.id;
        const provider = await User.findById(providerId).lean();
        
        if (!provider || provider.role !== 'service_provider') {
            return res.status(404).json({
                success: false,
                error: 'Service provider not found'
            });
        }
        
        // Fetch reviews
        const reviews = await Review.find({ 
            targetType: 'ServiceProvider', 
            targetId: providerId 
        })
        .populate('user', 'fullName username')
        .sort({ createdAt: -1 })
        .lean();
        
        const reviewCount = reviews.length;
        const avgRating = reviewCount > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
            : 0;
        
        // Calculate rating distribution
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            if (ratingDistribution.hasOwnProperty(review.rating)) {
                ratingDistribution[review.rating]++;
            }
        });
        
        const price = calculateServicePrice(provider.serviceType);
        
        const serviceDetails = {
            _id: provider._id,
            id: provider._id.toString(),
            name: provider.fullName || 'Service Provider',
            fullName: provider.fullName || 'Service Provider',
            category: mapServiceCategory(provider.serviceType || ''),
            serviceType: provider.serviceType,
            location: provider.serviceAddress || 'Available Locally',
            serviceAddress: provider.serviceAddress || 'Available Locally',
            description: provider.serviceDescription || 'Professional pet services provider.',
            serviceDescription: provider.serviceDescription || 'Professional pet services provider.',
            email: provider.email,
            phone: provider.phoneNo || provider.phone || 'Contact via email',
            phoneNo: provider.phoneNo || provider.phone,
            experienceYears: provider.experienceYears,
            experience: provider.experienceYears ? `${provider.experienceYears} years` : undefined,
            availability: provider.availability,
            rating: parseFloat(avgRating.toFixed(1)) || 0,
            reviewCount: reviewCount || 0,
            ratingDistribution,
            price: price,
            profilePicture: provider.profilePicture 
                ? `/images/user/${provider._id}/profile` 
                : null,
            reviews: reviews.map(review => ({
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                user: {
                    _id: review.user?._id,
                    name: review.user?.fullName || review.user?.username || 'Customer'
                },
                createdAt: review.createdAt,
                reply: review.reply
            }))
        };
        
        // Check if current user has reviewed
        let userReview = null;
        if (req.user && req.user._id) {
            userReview = await Review.findOne({
                user: req.user._id,
                targetType: 'ServiceProvider',
                targetId: providerId
            }).lean();
        }
        
        res.json({
            success: true,
            data: {
                service: serviceDetails,
                userReview: userReview ? {
                    _id: userReview._id,
                    rating: userReview.rating,
                    comment: userReview.comment
                } : null
            }
        });
    } catch (err) {
        console.error('Error fetching service details:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading service details',
            message: err.message
        });
    }
});

// Get provider reviews only (for pagination)
router.get('/:id/reviews', async (req, res) => {
    try {
        const providerId = req.params.id;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
        
        // Build sort option
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };
        if (sortBy === 'highest-rating') sortOption = { rating: -1 };
        if (sortBy === 'lowest-rating') sortOption = { rating: 1 };
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Review.countDocuments({ 
            targetType: 'ServiceProvider', 
            targetId: providerId 
        });
        
        const reviews = await Review.find({ 
            targetType: 'ServiceProvider', 
            targetId: providerId 
        })
        .populate('user', 'fullName username')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
        
        const reviewCount = total;
        const allReviews = await Review.find({ 
            targetType: 'ServiceProvider', 
            targetId: providerId 
        }).select('rating').lean();
        
        const avgRating = reviewCount > 0 
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
            : 0;
        
        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    user: {
                        _id: review.user?._id,
                        name: review.user?.fullName || review.user?.username || 'Customer'
                    },
                    createdAt: review.createdAt
                })),
                statistics: {
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    reviewCount
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Error fetching provider reviews:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading reviews',
            message: err.message
        });
    }
});

// Book a service (create booking and process payment)
router.post('/:id/book', isAuthenticated, async (req, res) => {
    try {
        const providerId = req.params.id;
        const { date, time, paymentMethod, paymentDetails, notes } = req.body;
        
        // Validate provider
        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'service_provider') {
            return res.status(404).json({
                success: false,
                error: 'Service provider not found'
            });
        }
        
        // Validate required fields
        if (!date || !time) {
            return res.status(400).json({
                success: false,
                error: 'Date and time are required'
            });
        }
        
        const amount = calculateServicePrice(provider.serviceType);
        
        // Process payment
        if (paymentMethod === 'wallet') {
            const customerWallet = await Wallet.findOne({ user: req.user._id });
            if (!customerWallet) {
                return res.status(400).json({
                    success: false,
                    error: 'Wallet not found'
                });
            }
            
            if (customerWallet.balance < amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient wallet balance'
                });
            }
            
            // Deduct from customer
            await customerWallet.deductFunds(amount);
            
            // Add to provider (95%)
            const providerWallet = await Wallet.findOne({ user: providerId });
            if (providerWallet) {
                const providerShare = amount * 0.95;
                await providerWallet.addFunds(providerShare);
            }
            
            // Add commission to admin (5%)
            const adminWallet = await Wallet.findOne({ user: "6807e4424877bcd9980c7e00" });
            if (adminWallet) {
                const adminCommission = amount * 0.05;
                await adminWallet.addFunds(adminCommission);
            }
            
            // Create transaction record
            await new Transaction({
                from: req.user._id,
                to: providerId,
                amount: amount,
                type: 'service_booking',
                description: `Booking for ${provider.fullName} - ${mapServiceCategory(provider.serviceType)}`
            }).save();
            
        } else if (paymentMethod === 'upi') {
            const upiId = paymentDetails?.upiId?.trim();
            const upiRegex = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
            if (!upiRegex.test(upiId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid UPI ID'
                });
            }
        } else if (paymentMethod === 'credit-card' || paymentMethod === 'card') {
            const name = paymentDetails?.cardName?.trim();
            const number = paymentDetails?.cardNumber?.replace(/\s+/g, '');
            const expiry = paymentDetails?.expiryDate?.trim();
            const cvv = paymentDetails?.cvv?.trim();
            
            const numRegex = /^\d{13,19}$/;
            const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
            const cvvRegex = /^\d{3,4}$/;
            
            if (!name || !numRegex.test(number) || !expRegex.test(expiry) || !cvvRegex.test(cvv)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid card details'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                error: 'Unsupported payment method'
            });
        }
        
        // Create booking
        const booking = new Booking({
            user: req.user._id,
            service: providerId,
            date: date,
            time: time,
            status: 'confirmed',
            notes: notes || '',
            paymentMethod: paymentMethod,
            amount: amount
        });
        
        await booking.save();
        
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                bookingId: booking._id,
                providerId: providerId,
                providerName: provider.fullName,
                date: booking.date,
                time: booking.time,
                amount: amount,
                status: booking.status
            }
        });
        
    } catch (err) {
        console.error('Service booking error:', err);
        res.status(500).json({
            success: false,
            error: 'Booking failed',
            message: err.message
        });
    }
});

// Get available time slots for a provider on a specific date
router.get('/:id/availability', async (req, res) => {
    try {
        const providerId = req.params.id;
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Date is required'
            });
        }
        
        // Get existing bookings for this date
        const existingBookings = await Booking.find({
            service: providerId,
            date: date,
            status: { $ne: 'cancelled' }
        }).select('time').lean();
        
        const bookedTimes = existingBookings.map(b => b.time);
        
        // Generate all possible time slots (9 AM - 6 PM)
        const allTimeSlots = [
            '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
        ];
        
        const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
        
        res.json({
            success: true,
            data: {
                date,
                availableSlots,
                bookedSlots: bookedTimes
            }
        });
    } catch (err) {
        console.error('Error fetching availability:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching availability',
            message: err.message
        });
    }
});

module.exports = router;