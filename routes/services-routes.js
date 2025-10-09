const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services');

// GET /services - Display all service providers
router.get('/', servicesController.getServices);

// GET /services/breeders - Display only breeder services
router.get('/breeders', servicesController.getBreederServices);

// GET /services/:id - Get details for a specific service provider
router.get('/:id', servicesController.getServiceDetails);

// GET /services/api/reviews/:providerId - Get reviews (AJAX)
router.get('/api/reviews/:providerId', servicesController.getProviderReviews);

// Add this new route
router.get('/api/filter-breeders', servicesController.filterBreedersByLocation);

module.exports = router;
