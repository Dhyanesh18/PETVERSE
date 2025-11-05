const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Toggle pet wishlist
router.post('/pet/:petId/toggle', wishlistController.togglePetWishlist);

// Toggle product wishlist
router.post('/product/:productId/toggle', wishlistController.toggleProductWishlist);

// Get wishlist status for an item
router.get('/status/:type/:id', wishlistController.getWishlistStatus);

module.exports = router;