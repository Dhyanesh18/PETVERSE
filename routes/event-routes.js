const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event');
const multer = require('multer');
const path = require('path');

// Configure multer for document uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: function (req, file, callback) {
        // Get file extension
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Allowed extensions for permission document
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        
        // Allowed MIME types
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        // Check both extension and MIME type
        if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed for permission document'));
        }
    }
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check if user is service provider
function isServiceProvider(req, res, next) {
    if (req.user && req.user.role === 'service_provider') {
        return next();
    }
    res.status(403).render('error', {
        message: 'Access denied. Service providers only.'
    });
}

// Public routes
router.get('/', eventController.getEvents);
router.get('/api/list', eventController.getEventsAPI); // New API endpoint
router.get('/:id', eventController.getEventDetails);

// Service provider routes
router.get('/add/new', isAuthenticated, isServiceProvider, eventController.showAddEventForm);
router.post('/add', isAuthenticated, isServiceProvider, upload.single('permissionDocument'), eventController.createEvent);

// User routes (requires authentication)
router.post('/register', isAuthenticated, eventController.registerForEvent);
router.delete('/:id/unregister', isAuthenticated, eventController.unregisterFromEvent);
router.get('/my/registered', isAuthenticated, eventController.getMyEvents);

// Organizer routes (service provider only)
router.get('/my/organized', isAuthenticated, isServiceProvider, eventController.getOrganizerEvents);

module.exports = router;
