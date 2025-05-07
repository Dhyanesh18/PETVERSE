const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review");
const { isAuthenticated } = require('../middleware/auth');

// Create a new review
router.post("/reviews", isAuthenticated, reviewController.createReview);

// Get reviews for a product
router.get("/reviews/product/:productId", reviewController.getProductReviews);

// Get reviews for a service provider
router.get("/reviews/provider/:providerId", reviewController.getServiceProviderReviews);

// Get a user's existing review for a target
router.get("/reviews/user/:targetType/:targetId", isAuthenticated, reviewController.getUserReview);

module.exports = router;