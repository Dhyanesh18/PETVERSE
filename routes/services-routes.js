const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services');

// GET /services - Display all service providers
router.get('/', servicesController.getServices);

module.exports = router;