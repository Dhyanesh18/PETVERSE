const express = require('express');
const router = express.Router();
const multer = require('multer');
const eventController = require('../controllers/event');
const { isAuthenticated, isServiceProvider } = require('../middleware/auth');

// Multer configuration for event images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventDetails);

// Authenticated user routes
router.get('/user/my-events', isAuthenticated, eventController.getMyEvents);
router.post('/register', isAuthenticated, eventController.registerForEvent);
router.delete('/:eventId/unregister', isAuthenticated, eventController.unregisterFromEvent);

// Service provider routes
router.get('/add/new', isAuthenticated, isServiceProvider, eventController.showAddEventForm);
router.post('/add', isAuthenticated, isServiceProvider, upload.array('images', 3), eventController.createEvent);
router.get('/organizer/manage', isAuthenticated, isServiceProvider, eventController.getOrganizerEvents);

module.exports = router;
