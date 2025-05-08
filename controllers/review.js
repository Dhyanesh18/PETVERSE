const Review = require("../models/reviews");
const Product = require("../models/products");
const User = require("../models/users");

// Get a user's existing review for a product
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

exports.createReview = async (req, res) => {
    try {
        const { rating, comment, targetType, targetId } = req.body;
        
        // Use the current user from session instead of requiring userId in the request
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

        // Log the request data for debugging
        console.log('Creating review with data:', {
            userId,
            rating,
            comment,
            targetType,
            targetId
        });
        
        // Validate target exists based on targetType
        let targetExists = false;
        
        if (targetType === 'Product') {
            const product = await Product.findById(targetId);
            targetExists = !!product;
        } else if (targetType === 'Seller') {
            const seller = await User.findById(targetId);
            targetExists = !!seller && seller.role === 'seller';
        } else if (targetType === 'ServiceProvider') {
            const provider = await User.findById(targetId);
            targetExists = !!provider && provider.role === 'service_provider';
            
            if (!targetExists) {
                console.log(`Provider not found or not a service provider: ${targetId}`);
            }
        }
        
        if (!targetExists) {
            return res.status(400).json({
                success: false,
                message: `${targetType} not found`
            });
        }
        
        // Check if user already reviewed this target
        const existingReview = await Review.findOne({
            user: userId,
            targetType,
            targetId
        });
        
        let review;
        
        if (existingReview) {
            // Update existing review
            console.log(`Updating existing review ${existingReview._id}`);
            review = await Review.findByIdAndUpdate(
                existingReview._id,
                {
                    rating,
                    comment
                },
                { new: true }
            );
            
            return res.status(200).json({
                success: true,
                message: 'Review updated successfully',
                review
            });
        } else {
            // Create new review
            console.log('Creating new review');
            review = await Review.create({
                user: userId,
                rating,
                comment,
                targetType,
                targetId
            });
            
            return res.status(201).json({
                success: true,
                message: 'Review submitted successfully',
                review
            });
        }
    } catch (err) {
        console.error('Error creating review:', err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your review'
        });
    }
};

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
        
        // Calculate the average rating
        let totalRating = 0;
        reviews.forEach(review => {
            totalRating += review.rating;
        });
        
        const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
        
        return res.status(200).json({
            success: true,
            count: reviews.length,
            avgRating,
            reviews
        });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching reviews'
        });
    }
};