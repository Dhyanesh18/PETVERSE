const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services');

// GET /services - Display all service providers
router.get('/', servicesController.getServices);

// GET /services/:id - Get details for a specific service provider
router.get('/:id', servicesController.getServiceDetails);

module.exports = router;