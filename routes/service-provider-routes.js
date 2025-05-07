const express = require('express');
const router = express.Router();
const { isAuthenticated, isServiceProvider } = require('../middleware/auth');
const { getDashboard } = require('../controllers/serviceProviderController');

router.get('/dashboard', isAuthenticated, isServiceProvider, getDashboard);

module.exports = router; 