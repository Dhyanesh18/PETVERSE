const express = require('express');
const router = express.Router();
const multer = require('multer');
const Pet = require('../models/pets');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Max 5 images
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Middleware to check if user is authenticated
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

// Middleware to check if user is a seller
function isSeller(req, res, next) {
    if (req.user && req.user.role === 'seller') {
        return next();
    }
    res.status(403).json({
        success: false,
        error: 'Access denied. Sellers only.'
    });
}

// Get all pets with optional filters (API endpoint)
router.get('/', async (req, res) => {
    try {
        const { category, available, minPrice, maxPrice, gender, breed, age, page = 1, limit = 12 } = req.query;
        
        let query = {};
        
        // Filter by category
        if (category) {
            const categoryMap = {
                'dogs': 'Dog',
                'cats': 'Cat',
                'birds': 'Bird',
                'fish': 'Fish',
                'other': 'Other'
            };
            query.category = categoryMap[category.toLowerCase()] || category;
        }
        
        // Filter by availability
        if (available !== undefined) {
            query.available = available === 'true';
        } else {
            query.available = true; // Default to showing only available pets
        }
        
        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        
        // Filter by gender
        if (gender) {
            query.gender = gender.toLowerCase();
        }
        
        // Filter by breed
        if (breed) {
            query.breed = new RegExp(breed, 'i');
        }
        
        // Filter by age
        if (age) {
            query.age = age;
        }
        
        console.log('Pet filter query:', JSON.stringify(query));
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Pet.countDocuments(query);
        
        const pets = await Pet.find(query)
            .populate('addedBy', 'fullName username email phoneNo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        console.log(`Found ${pets.length} pets matching filters`);
        
        // Transform pets data for response (don't include full image buffers)
        const petsForResponse = pets.map(pet => ({
            _id: pet._id,
            name: pet.name,
            category: pet.category,
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender,
            price: pet.price,
            description: pet.description,
            available: pet.available,
            addedBy: pet.addedBy,
            createdAt: pet.createdAt,
            imageCount: pet.images ? pet.images.length : 0,
            // Provide image URLs instead of raw data
            imageUrls: pet.images ? pet.images.map((_, index) => 
                `/images/pet/${pet._id}/${index}`
            ) : [],
            // Provide first image URL as thumbnail
            thumbnail: pet.images && pet.images.length > 0 ? 
                `/images/pet/${pet._id}/0` : null
        }));
        
        res.json({
            success: true,
            data: {
                pets: petsForResponse,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    category: category || null,
                    available: available || null,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    gender: gender || null,
                    breed: breed || null,
                    age: age || null
                }
            }
        });
    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching pets',
            message: err.message
        });
    }
});

// Get filter options (categories, breeds, etc.)
router.get('/filter-options', async (req, res) => {
    try {
        // Get distinct breeds from database
        const distinctBreeds = await Pet.distinct('breed');
        
        const breeds = distinctBreeds
            .filter(breed => breed) // Remove null/undefined
            .map(breed => ({
                value: breed,
                label: breed
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        res.json({
            success: true,
            data: {
                categories: [
                    { value: 'dogs', label: 'Dogs', dbValue: 'Dog' },
                    { value: 'cats', label: 'Cats', dbValue: 'Cat' },
                    { value: 'birds', label: 'Birds', dbValue: 'Bird' },
                    { value: 'fish', label: 'Fish', dbValue: 'Fish' },
                    { value: 'other', label: 'Other', dbValue: 'Other' }
                ],
                genders: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                ],
                breeds
            }
        });
    } catch (err) {
        console.error('Error fetching filter options:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching filter options',
            message: err.message
        });
    }
});

// Get single pet details by ID
router.get('/:id', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id)
            .populate('addedBy', 'fullName username email phoneNo')
            .lean();

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        // Find similar pets (same category, different id)
        const similarPets = await Pet.find({ 
            category: pet.category,
            _id: { $ne: pet._id },
            available: true
        })
        .limit(4)
        .lean();

        // Transform pet data
        const petForResponse = {
            ...pet,
            imageCount: pet.images ? pet.images.length : 0,
            imageUrls: pet.images ? pet.images.map((_, index) => 
                `/images/pet/${pet._id}/${index}`
            ) : [],
            thumbnail: pet.images && pet.images.length > 0 ? 
                `/images/pet/${pet._id}/0` : null
        };

        // Remove raw image data
        delete petForResponse.images;

        // Transform similar pets
        const similarPetsForResponse = similarPets.map(p => ({
            _id: p._id,
            name: p.name,
            category: p.category,
            breed: p.breed,
            age: p.age,
            gender: p.gender,
            price: p.price,
            description: p.description,
            thumbnail: p.images && p.images.length > 0 ? 
                `/images/pet/${p._id}/0` : null
        }));

        res.json({
            success: true,
            data: {
                pet: petForResponse,
                similarPets: similarPetsForResponse
            }
        });
    } catch (err) {
        console.error('Error fetching pet details:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching pet details',
            message: err.message
        });
    }
});

// Create new pet listing (sellers only)
router.post('/add', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
    try {
        console.log('=== PET LISTING SUBMISSION ===');
        console.log('Request body:', req.body);
        console.log('Files received:', req.files ? req.files.length : 'none');
        console.log('User authenticated:', req.user ? req.user._id : 'NO USER');

        // Validation
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'At least one image is required' 
            });
        }

        // Validate required fields
        const requiredFields = ['name', 'category', 'breed', 'age', 'gender', 'price'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                missingFields
            });
        }

        // Validate price
        const price = parseFloat(req.body.price);
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be a positive number'
            });
        }

        const petData = {
            name: req.body.name,
            category: req.body.category,
            breed: req.body.breed,
            age: req.body.age,
            gender: req.body.gender.toLowerCase(),
            price: price,
            description: req.body.description || '',
            available: req.body.available !== 'false', // Default to true
            addedBy: req.user._id,
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }))
        };

        console.log('Creating new pet listing with data:', {
            name: petData.name,
            category: petData.category,
            breed: petData.breed,
            price: petData.price
        });

        const newPet = await Pet.create(petData);
        console.log('Successfully created pet listing with ID:', newPet._id);
        
        res.status(201).json({
            success: true,
            message: 'Pet listing created successfully',
            data: {
                petId: newPet._id,
                name: newPet.name,
                category: newPet.category,
                price: newPet.price
            }
        });
    } catch (err) {
        console.error('Pet creation error:', err);
        console.error('Error stack:', err.stack);
        
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to create pet listing',
            message: err.message
        });
    }
});

// Get user's own pet listings (sellers)
router.get('/my/listings', isAuthenticated, isSeller, async (req, res) => {
    try {
        const listings = await Pet.find({ addedBy: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        const listingsForResponse = listings.map(listing => ({
            ...listing,
            imageCount: listing.images ? listing.images.length : 0,
            imageUrls: listing.images ? listing.images.map((_, index) => 
                `/images/pet/${listing._id}/${index}`
            ) : [],
            thumbnail: listing.images && listing.images.length > 0 ? 
                `/images/pet/${listing._id}/0` : null
        }));

        // Remove raw image data
        listingsForResponse.forEach(listing => delete listing.images);

        res.json({
            success: true,
            data: {
                listings: listingsForResponse,
                total: listingsForResponse.length
            }
        });
    } catch (err) {
        console.error('Error fetching user pet listings:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching your listings',
            message: err.message
        });
    }
});

// Update pet listing (owner only)
router.patch('/:id', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        // Check ownership
        if (pet.addedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this listing'
            });
        }

        // Update basic fields if provided
        if (req.body.name) pet.name = req.body.name;
        if (req.body.category) pet.category = req.body.category;
        if (req.body.breed) pet.breed = req.body.breed;
        if (req.body.age) pet.age = req.body.age;
        if (req.body.gender) pet.gender = req.body.gender.toLowerCase();
        if (req.body.price) pet.price = parseFloat(req.body.price);
        if (req.body.description !== undefined) pet.description = req.body.description;
        if (req.body.available !== undefined) pet.available = req.body.available === 'true';

        // Handle image updates
        if (req.body.keepImages) {
            // Keep only selected existing images
            const keepImages = Array.isArray(req.body.keepImages) 
                ? req.body.keepImages 
                : [req.body.keepImages];
            pet.images = pet.images.filter((img, index) => keepImages.includes(index.toString()));
        }

        // Add new images if provided
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
            pet.images = [...(pet.images || []), ...newImages];
        }

        await pet.save();

        res.json({
            success: true,
            message: 'Pet listing updated successfully',
            data: {
                petId: pet._id,
                name: pet.name
            }
        });
    } catch (err) {
        console.error('Error updating pet listing:', err);
        res.status(400).json({
            success: false,
            error: 'Failed to update pet listing',
            message: err.message
        });
    }
});

// Delete pet listing (owner only)
router.delete('/:id', isAuthenticated, isSeller, async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        // Check ownership
        if (pet.addedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this listing'
            });
        }

        await Pet.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Pet listing deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting pet listing:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to delete pet listing',
            message: err.message
        });
    }
});

// Get pet image (binary data for <img> tags)
router.get('/image/:petId/:index', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.petId);
        const imageIndex = parseInt(req.params.index);
        
        if (!pet || !pet.images || !pet.images[imageIndex]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }
        
        const image = pet.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(image.data);
    } catch (err) {
        console.error('Image load error:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading image',
            message: err.message
        });
    }
});

// Get pets by category (alternative endpoint for backwards compatibility)
router.get('/category/:category', async (req, res) => {
    try {
        const categoryMap = {
            'dogs': 'Dog',
            'cats': 'Cat',
            'birds': 'Bird',
            'fish': 'Fish',
            'other': 'Other'
        };

        const category = req.params.category.toLowerCase();
        const categoryTitle = categoryMap[category] || category;

        const pets = await Pet.find({ 
            category: categoryTitle,
            available: true 
        })
        .populate('addedBy', 'username fullName')
        .lean();

        const petsForResponse = pets.map(pet => ({
            _id: pet._id,
            name: pet.name,
            category: pet.category,
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender,
            price: pet.price,
            description: pet.description,
            available: pet.available,
            addedBy: pet.addedBy,
            thumbnail: pet.images && pet.images.length > 0 ? 
                `/images/pet/${pet._id}/0` : null
        }));

        res.json({
            success: true,
            data: {
                categoryTitle,
                category,
                pets: petsForResponse,
                total: petsForResponse.length,
                categoryFilters: [
                    { id: 'dogs', value: 'dogs', label: 'Dogs' },
                    { id: 'cats', value: 'cats', label: 'Cats' },
                    { id: 'birds', value: 'birds', label: 'Birds' },
                    { id: 'fish', value: 'fish', label: 'Fish' },
                    { id: 'other', value: 'other', label: 'Other' }
                ]
            }
        });
    } catch (err) {
        console.error('Error loading pets by category:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading pets',
            message: err.message
        });
    }
});

module.exports = router;