const Review = require("../models/reviews");
const Product = require("../models/products");
const User = require("../models/users");
const Booking = require("../models/Booking");

exports.createReview = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to submit a review'
            });
        }

        const { userId, rating, comment, productId, targetType, targetId } = req.body;

        if (!userId || !rating || !targetType || !targetId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Missing required fields: userId, rating, targetType, targetId'
            });
        }

        if (userId !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only submit reviews for yourself'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        if (targetType === 'Product') {
            const product = await Product.findById(targetId);
            if (!product) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Product not found'
                });
            }
        } else if (targetType === 'ServiceProvider') {
            const provider = await User.findById(targetId);
            if (!provider || provider.role !== 'service_provider') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Service provider not found'
                });
            }

            // Ensure user has a booking with this provider
            const booking = await Booking.findOne({
                user: userId,
                provider: targetId
            });
            if (!booking) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You must have a booking with this provider to submit a review'
                });
            }
        } else {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid targetType'
            });
        }

        const newReview = await Review.create({
            user: userId,
            rating,
            comment,
            targetType,
            targetId
        });

        res.status(201).json({
            status: "success",
            data: {
                review: newReview
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            targetType: 'Product',
            targetId: req.params.productId
        }).populate('user', 'username');
        res.status(200).json({
            status: "success",
            data: {
                reviews
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getServiceProviderReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            targetType: 'ServiceProvider',
            targetId: req.params.providerId
        }).populate('user', 'username');
        res.status(200).json({
            status: "success",
            data: {
                reviews
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};