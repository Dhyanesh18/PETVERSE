const express = require('express');
const router = express.Router();
const multer = require('multer');
const sellerAuth = require('../middleware/sellerAuth');
const Pet = require('../models/pets');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024,
        files: 5
    }
});
const petController = require('../controllers/pet');

// Add pet listing page
router.get('/pets/add', sellerAuth, (req, res) => {
    res.render('add-pet');
});

// Handle pet submission
router.post('/pets/add', sellerAuth, upload.array('images'), async (req, res) => {
    try {
        const petData = req.body;
        const images = req.files.map(file => ({
            data: file.buffer,
            contentType: file.mimetype
        }));

        const newPet = new Pet({
            ...petData,
            addedBy: req.user._id,
            images: images
        });

        await newPet.save();
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Pet creation error:', err);
        res.status(400).json({
            success: false,
            message: 'Error creating pet listing: ' + err.message
        });
    }
});

// Get pets by category
router.get('/pets/:category', async (req, res) => {
    try {
        const categoryMap = {
            'dogs': 'Dog',
            'cats': 'Cat',
            'birds': 'Bird',
            'fish': 'Fish',
            'other': 'Other'
        };

        const category = req.params.category;
        const categoryTitle = categoryMap[category] || 'Pets';

        const pets = await Pet.find({ 
            category: categoryTitle,
            available: true 
        }).populate('addedBy', 'username');

        res.render('pets', {
            categoryTitle: categoryTitle,
            category: category,
            pets: pets,
            categoryFilters: [
                { id: 'dogs', value: 'dogs', label: 'Dogs' },
                { id: 'cats', value: 'cats', label: 'Cats' },
                { id: 'birds', value: 'birds', label: 'Birds' },
                { id: 'fish', value: 'fish', label: 'Fish' },
                { id: 'other', value: 'other', label: 'Other' }
            ]
        });
    } catch (err) {
        res.status(500).render('error', { message: 'Error loading pets' });
    }
});

// Get single pet
router.get("/pets/:id", petController.getPetById);

// Add a specific route for pet details that's easier to access directly
router.get("/detail/:id", petController.getPetById);

// Image route
router.get('/pet/image/:petId/:index', petController.getPetImage);

module.exports = router;