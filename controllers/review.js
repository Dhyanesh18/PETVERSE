const Review = require("../models/reviews");
const Product = require("../models/products");
const User = require("../models/users");
const Booking = require("../models/Booking");

// Get a user's existing review for a product (from main)
exports.getUserReview = async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const userId = req.session.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to access your review'
            });
        }
        
        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: targetType, targetId'
            });
        }
        
        const review = await Review.findOne({
            user: userId,
            targetType,
            targetId
        });
        
        if (!review) {
            return res.status(200).json({
                success: true,
                hasReview: false,
                message: 'No review found for this user and target'
            });
        }
        
        return res.status(200).json({
            success: true,
            hasReview: true,
            review
        });
    } catch (err) {
        console.error('Error fetching user review:', err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching your review'
        });
    }
};

// Combined createReview with validation from both branches
exports.createReview = async (req, res) => {
    try {
        const { rating, comment, targetType, targetId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to leave a review'
            });
        }

        if (!rating || !targetType || !targetId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: rating, targetType, targetId'
            });
        }

        // Validate target existence
        let targetExists = false;
        if (targetType === 'Product') {
            targetExists = await Product.exists({ _id: targetId });
        } else if (targetType === 'Seller') {
            const seller = await User.findOne({ _id: targetId, role: 'seller' });
            targetExists = !!seller;
        } else if (targetType === 'ServiceProvider') {
            const provider = await User.findOne({ _id: targetId, role: 'service_provider' });
            targetExists = !!provider;
            
            // Add booking validation from feature branch
            if (targetExists) {
                const hasBooking = await Booking.exists({
                    user: userId,
                    provider: targetId
                });
                
                if (!hasBooking) {
                    return res.status(403).json({
                        success: false,
                        message: 'You must have a booking with this provider to submit a review'
                    });
                }
            }
        }

        if (!targetExists) {
            return res.status(400).json({
                success: false,
                message: `${targetType} not found`
            });
        }

        // Check for existing review
        const existingReview = await Review.findOne({
            user: userId,
            targetType,
            targetId
        });

        let review;
        if (existingReview) {
            // Update existing review
            review = await Review.findByIdAndUpdate(
                existingReview._id,
                { rating, comment },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                message: 'Review updated successfully',
                review
            });
        }

        // Create new review
        review = await Review.create({
            user: userId,
            rating,
            comment,
            targetType,
            targetId
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });

    } catch (err) {
        console.error('Error creating review:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your review'
        });
    }
};

// Combined getProductReviews with average rating calculation
exports.getProductReviews = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        const reviews = await Review.find({
            targetType: 'Product',
            targetId: productId
        })
        .populate('user', 'username firstName lastName profileImage')
        .sort({ createdAt: -1 });
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = reviews.length > 0 
            ? (totalRating / reviews.length).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            avgRating,
            reviews
        });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching reviews'
        });
    }
};

// Service provider reviews from feature branch
exports.getServiceProviderReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            targetType: 'ServiceProvider',
            targetId: req.params.providerId
        })
        .populate('user', 'username firstName lastName profileImage')
        .sort({ createdAt: -1 });

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = reviews.length > 0 
            ? (totalRating / reviews.length).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            avgRating,
            reviews
        });
    } catch (err) {
        console.error('Error fetching service provider reviews:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching reviews'
        });
    }
};