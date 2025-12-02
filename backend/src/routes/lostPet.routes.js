const express = require('express');
const router = express.Router();
const multer = require('multer');
const lostPetController = require('../controllers/lostPet.controller');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.user) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirectPath: '/login'
    });
}

// Public routes
router.get('/', lostPetController.getAllLostPets);
router.get('/:id', lostPetController.getLostPetById);
router.get('/image/:id/:index', lostPetController.getLostPetImage);

// Protected routes
router.post('/create', isAuthenticated, upload.array('images', 5), lostPetController.createLostPet);
router.get('/user/my-posts', isAuthenticated, lostPetController.getUserLostPets);
router.put('/:id', isAuthenticated, upload.array('images', 5), lostPetController.updateLostPet);
router.patch('/:id/status', isAuthenticated, lostPetController.updateStatus);
router.post('/:id/comment', isAuthenticated, lostPetController.addComment);
router.delete('/:id', isAuthenticated, lostPetController.deleteLostPet);

module.exports = router;
