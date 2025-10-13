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

// Edit pet page - MUST come before generic :id route
router.get('/pets/:id/edit', sellerAuth, async (req, res) => {
    try {
        const pet = await Pet.findOne({ _id: req.params.id, addedBy: req.user._id });
        if (!pet) {
            return res.status(404).render('error', { message: 'Pet not found or you do not have permission to edit it' });
        }
        res.render('edit-pet', { pet });
    } catch (err) {
        console.error('Error loading pet for edit:', err);
        res.status(500).render('error', { message: 'Error loading pet' });
    }
});

// Handle pet update - MUST come before generic :id route
router.post('/pets/:id/edit', sellerAuth, upload.array('images'), async (req, res) => {
    try {
        const pet = await Pet.findOne({ _id: req.params.id, addedBy: req.user._id });
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found or you do not have permission to edit it' });
        }

        // Update basic fields
        pet.name = req.body.name;
        pet.category = req.body.category;
        pet.breed = req.body.breed;
        pet.age = req.body.age;
        pet.gender = req.body.gender;
        pet.price = req.body.price;
        pet.description = req.body.description;

        // Handle image deletion
        if (req.body.keepImages) {
            const keepImages = Array.isArray(req.body.keepImages) ? req.body.keepImages : [req.body.keepImages];
            pet.images = pet.images.filter((img, index) => keepImages[index] === 'true');
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
            pet.images = [...pet.images, ...newImages];
        }

        await pet.save();
        res.json({ success: true, message: 'Pet updated successfully' });
    } catch (err) {
        console.error('Pet update error:', err);
        res.status(400).json({
            success: false,
            message: 'Error updating pet: ' + err.message
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