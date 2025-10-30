const express = require('express');
const router = express.Router();
const Review = require('../models/reviews');
const Product = require('../models/products');
const User = require('../models/users');

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

// Get reviews for a specific target (Product, Seller, or Service Provider)
router.get('/:targetType/:targetId', async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

        // Validate targetType
        const validTypes = ['Product', 'Seller', 'ServiceProvider'];
        if (!validTypes.includes(targetType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid target type',
                validTypes
            });
        }

        // Build sort option
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };
        if (sortBy === 'highest-rating') sortOption = { rating: -1 };
        if (sortBy === 'lowest-rating') sortOption = { rating: 1 };

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Review.countDocuments({ targetType, targetId });

        const reviews = await Review.find({ targetType, targetId })
            .populate('user', 'fullName username profilePicture')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Calculate average rating
        const reviewCount = total;
        const avgRating = reviewCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

        // Calculate rating distribution
        const ratingDistribution = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        
        const allReviews = await Review.find({ targetType, targetId }).select('rating').lean();
        allReviews.forEach(review => {
            if (ratingDistribution.hasOwnProperty(review.rating)) {
                ratingDistribution[review.rating]++;
            }
        });

        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    user: {
                        _id: review.user._id,
                        fullName: review.user.fullName,
                        username: review.user.username,
                        profilePicture: review.user.profilePicture 
                            ? `/images/user/${review.user._id}/profile` 
                            : null
                    },
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt,
                    timeAgo: getTimeAgo(review.createdAt)
                })),
                statistics: {
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    reviewCount,
                    ratingDistribution
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
        console.error('Error fetching reviews:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching reviews',
            message: err.message
        });
    }
});

// Get user's existing review for a target
router.get('/user/:targetType/:targetId', isAuthenticated, async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const userId = req.user._id;

        // Validate targetType
        const validTypes = ['Product', 'Seller', 'ServiceProvider'];
        if (!validTypes.includes(targetType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid target type',
                validTypes
            });
        }

        const review = await Review.findOne({
            user: userId,
            targetType,
            targetId
        }).lean();

        if (!review) {
            return res.json({
                success: true,
                hasReview: false,
                review: null
            });
        }

        res.json({
            success: true,
            hasReview: true,
            data: {
                review: {
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt
                }
            }
        });
    } catch (err) {
        console.error('Error fetching user review:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching your review',
            message: err.message
        });
    }
});

// Create or update review
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { rating, comment, targetType, targetId } = req.body;
        const userId = req.user._id;

        // Validation
        if (!rating || !targetType || !targetId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                requiredFields: ['rating', 'targetType', 'targetId']
            });
        }

        // Validate targetType
        const validTypes = ['Product', 'Seller', 'ServiceProvider'];
        if (!validTypes.includes(targetType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid target type',
                validTypes
            });
        }

        // Validate rating (1-5)
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        console.log('Creating/Updating review:', {
            userId,
            rating: ratingNum,
            comment,
            targetType,
            targetId
        });

        // Validate target exists
        let targetExists = false;
        let targetName = '';
        
        if (targetType === 'Product') {
            const product = await Product.findById(targetId);
            targetExists = !!product;
            targetName = product ? product.name : '';
        } else if (targetType === 'Seller') {
            const seller = await User.findById(targetId);
            targetExists = !!seller && seller.role === 'seller';
            targetName = seller ? (seller.businessName || seller.fullName) : '';
        } else if (targetType === 'ServiceProvider') {
            const provider = await User.findById(targetId);
            targetExists = !!provider && provider.role === 'service_provider';
            targetName = provider ? provider.fullName : '';
        }

        if (!targetExists) {
            return res.status(404).json({
                success: false,
                error: `${targetType} not found`
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            user: userId,
            targetType,
            targetId
        });

        let review;
        let isUpdate = false;

        if (existingReview) {
            // Update existing review
            existingReview.rating = ratingNum;
            existingReview.comment = comment || '';
            existingReview.updatedAt = new Date();
            await existingReview.save();
            
            review = existingReview;
            isUpdate = true;
            
            console.log('Review updated successfully:', review._id);
        } else {
            // Create new review
            review = new Review({
                user: userId,
                rating: ratingNum,
                comment: comment || '',
                targetType,
                targetId
            });

            await review.save();
            console.log('Review created successfully:', review._id);
        }

        // Populate user info
        await review.populate('user', 'fullName username');

        // Calculate new statistics
        const allReviews = await Review.find({ targetType, targetId });
        const reviewCount = allReviews.length;
        const avgRating = reviewCount > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

        // Calculate rating distribution
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => {
            if (ratingDistribution.hasOwnProperty(r.rating)) {
                ratingDistribution[r.rating]++;
            }
        });

        res.status(isUpdate ? 200 : 201).json({
            success: true,
            message: isUpdate ? 'Review updated successfully' : 'Review submitted successfully',
            data: {
                review: {
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    user: review.user,
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt
                },
                statistics: {
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    reviewCount,
                    ratingDistribution
                },
                isUpdate
            }
        });

    } catch (err) {
        console.error('Error creating/updating review:', err);
        res.status(500).json({
            success: false,
            error: 'Error submitting review',
            message: err.message
        });
    }
});

// Delete review (user can only delete their own review)
router.delete('/:reviewId', isAuthenticated, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        // Check ownership
        if (review.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this review'
            });
        }

        const targetType = review.targetType;
        const targetId = review.targetId;

        await Review.findByIdAndDelete(reviewId);

        // Recalculate statistics after deletion
        const remainingReviews = await Review.find({ targetType, targetId });
        const reviewCount = remainingReviews.length;
        const avgRating = reviewCount > 0
            ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        remainingReviews.forEach(r => {
            if (ratingDistribution.hasOwnProperty(r.rating)) {
                ratingDistribution[r.rating]++;
            }
        });

        res.json({
            success: true,
            message: 'Review deleted successfully',
            data: {
                statistics: {
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    reviewCount,
                    ratingDistribution
                }
            }
        });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({
            success: false,
            error: 'Error deleting review',
            message: err.message
        });
    }
});

// Get review statistics for a target (without fetching all reviews)
router.get('/:targetType/:targetId/stats', async (req, res) => {
    try {
        const { targetType, targetId } = req.params;

        // Validate targetType
        const validTypes = ['Product', 'Seller', 'ServiceProvider'];
        if (!validTypes.includes(targetType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid target type',
                validTypes
            });
        }

        const reviews = await Review.find({ targetType, targetId }).select('rating').lean();
        const reviewCount = reviews.length;
        const avgRating = reviewCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (ratingDistribution.hasOwnProperty(r.rating)) {
                ratingDistribution[r.rating]++;
            }
        });

        res.json({
            success: true,
            data: {
                avgRating: parseFloat(avgRating.toFixed(1)),
                reviewCount,
                ratingDistribution,
                percentages: {
                    5: reviewCount > 0 ? Math.round((ratingDistribution[5] / reviewCount) * 100) : 0,
                    4: reviewCount > 0 ? Math.round((ratingDistribution[4] / reviewCount) * 100) : 0,
                    3: reviewCount > 0 ? Math.round((ratingDistribution[3] / reviewCount) * 100) : 0,
                    2: reviewCount > 0 ? Math.round((ratingDistribution[2] / reviewCount) * 100) : 0,
                    1: reviewCount > 0 ? Math.round((ratingDistribution[1] / reviewCount) * 100) : 0
                }
            }
        });
    } catch (err) {
        console.error('Error fetching review statistics:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching statistics',
            message: err.message
        });
    }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    return Math.floor(seconds) + ' second' + (Math.floor(seconds) > 1 ? 's' : '') + ' ago';
}

module.exports = router;