const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services');
const { isAuthenticated } = require('../middleware/auth');

// GET /services - Display all service providers
router.get('/', servicesController.getServices);

// GET /services/breeders - Display only breeder services
router.get('/breeders', servicesController.getBreederServices);

// GET /services/:id - Get details for a specific service provider
router.get('/:id', servicesController.getServiceDetails);

// Service payments (similar to events)
router.get('/:id/payment', isAuthenticated, servicesController.getServicePaymentPage);
router.post('/:id/pay', isAuthenticated, servicesController.payForService);

// GET /services/api/reviews/:providerId - Get reviews (AJAX)
router.get('/api/reviews/:providerId', servicesController.getProviderReviews);

// Add this new route
router.get('/api/filter-breeders', servicesController.filterBreedersByLocation);

module.exports = router;
