const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review");

router.post("/reviews", reviewController.createReview);
router.get("/reviews/product/:productId", reviewController.getProductReviews);

module.exports = router;
