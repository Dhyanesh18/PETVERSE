// mate-routes.js - VERIFY THIS ORDER IS CORRECT

const express = require('express');
const router = express.Router();
const multer = require('multer');
const mateController = require('../controllers/petMate');
const auth = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 4,
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// API route for filtering pets - must come BEFORE other routes
router.get('/mate/api/filter', mateController.filterPets);

// GET route to show the mate page - must come BEFORE the POST route
router.get('/mate', mateController.showMatePage);

// GET route for images
router.get('/mate/image/:mateId/:index', mateController.getMateImage);

// POST route to add a new listing - requires authentication
router.post('/mate/add', auth.isAuthenticated, upload.array('petImage', 4), mateController.addMateListing);

module.exports = router;