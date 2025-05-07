const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review");
const { isAuthenticated } = require('../middleware/auth');

router.post("/reviews", isAuthenticated, reviewController.createReview);
router.get("/reviews/product/:productId", reviewController.getProductReviews);
router.get("/reviews/provider/:providerId", reviewController.getServiceProviderReviews);

module.exports = router;