const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review");
const { isAuthenticated } = require('../middleware/auth');

// Create a new review
router.post("/api/reviews", isAuthenticated, reviewController.createReview);

// Get reviews for a product
router.get("/api/reviews/product/:productId", reviewController.getProductReviews);

// Get a user's existing review for a target
router.get("/api/reviews/user/:targetType/:targetId", isAuthenticated, reviewController.getUserReview);

module.exports = router;
