const express = require('express');
const router = express.Router();
const multer = require('multer');
const mateController = require('../controllers/petMate');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 4,
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
const auth = require('../middleware/auth');


// Display mate listings page
router.get('/mate', mateController.showMatePage);
router.post('/mate/add', auth.isAuthenticated, upload.array('petImage', 4), mateController.addMateListing);
router.get('/mate/image/:mateId/:index', mateController.getMateImage);
module.exports = router;