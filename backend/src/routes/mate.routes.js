const express = require('express');
const router = express.Router();
const multer = require('multer');
const PetMate = require('../models/petMate');
const auth = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 4,
        fileSize: 5 * 1024 * 1024 // 5MB
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

// Get all mate listings with optional filters (API endpoint)
router.get('/', async (req, res) => {
    try {
        const { petType, gender, breed, age, state, district, page = 1, limit = 12 } = req.query;
        
        let query = {
            // Ensure required fields exist
            breed: { $exists: true, $ne: null, $ne: '' }
        };
        
        // Filter by pet type
        if (petType) {
            const types = petType.split(',').map(t => t.trim().toLowerCase());
            query.petType = { $in: types };
        }
        
        // Filter by gender
        if (gender) {
            const genders = gender.split(',').map(g => g.trim().toLowerCase());
            query.gender = { $in: genders };
        }
        
        // Filter by breed
        if (breed) {
            const breeds = breed.split(',').map(b => b.trim().toLowerCase());
            query.breed = { $in: breeds.map(b => new RegExp(`^${b}$`, 'i')) };
        }
        
        // Filter by state
        if (state) {
            query['location.state'] = state;
        }
        
        // Filter by district
        if (district) {
            query['location.district'] = new RegExp(district, 'i');
        }
        
        console.log('Mate filter query:', JSON.stringify(query));
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await PetMate.countDocuments(query);
        
        const pets = await PetMate.find(query)
            .populate('listedBy', 'fullName email phoneNo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        console.log(`Found ${pets.length} mate listings matching filters`);
        
        // Transform pets data for response (don't include full image buffers)
        const petsForResponse = pets.map(pet => ({
            _id: pet._id,
            name: pet.name,
            petType: pet.petType,
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender,
            description: pet.description,
            location: pet.location,
            contact: pet.contact,
            registrationNumber: pet.registrationNumber,
            healthChecked: pet.healthChecked,
            listedBy: pet.listedBy,
            createdAt: pet.createdAt,
            imageCount: pet.images ? pet.images.length : 0,
            // Provide image URLs instead of raw data
            imageUrls: pet.images ? pet.images.map((_, index) => 
                `/images/mate/${pet._id}/${index}`
            ) : []
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
                    petType: petType || null,
                    gender: gender || null,
                    breed: breed || null,
                    state: state || null,
                    district: district || null
                }
            }
        });
    } catch (err) {
        console.error('Error fetching mate listings:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching mate listings',
            message: err.message
        });
    }
});

// Get filter options (pet types, breeds, states)
router.get('/filter-options', async (req, res) => {
    try {
        // Get distinct breeds from database
        const distinctBreeds = await PetMate.distinct('breed');
        
        const breeds = distinctBreeds
            .filter(breed => breed) // Remove null/undefined
            .map(breed => ({
                value: breed.toLowerCase().replace(/\s+/g, '-'),
                label: breed.charAt(0).toUpperCase() + breed.slice(1)
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        res.json({
            success: true,
            data: {
                petTypes: [
                    { value: 'dog', label: 'Dog' },
                    { value: 'cat', label: 'Cat' },
                    { value: 'bird', label: 'Bird' },
                    { value: 'other', label: 'Other' }
                ],
                genders: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                ],
                states: [
                    { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
                    { value: 'arunachal-pradesh', label: 'Arunachal Pradesh' },
                    { value: 'assam', label: 'Assam' },
                    { value: 'bihar', label: 'Bihar' },
                    { value: 'chhattisgarh', label: 'Chhattisgarh' },
                    { value: 'goa', label: 'Goa' },
                    { value: 'gujarat', label: 'Gujarat' },
                    { value: 'haryana', label: 'Haryana' },
                    { value: 'himachal-pradesh', label: 'Himachal Pradesh' },
                    { value: 'jharkhand', label: 'Jharkhand' },
                    { value: 'karnataka', label: 'Karnataka' },
                    { value: 'kerala', label: 'Kerala' },
                    { value: 'madhya-pradesh', label: 'Madhya Pradesh' },
                    { value: 'maharashtra', label: 'Maharashtra' },
                    { value: 'manipur', label: 'Manipur' },
                    { value: 'meghalaya', label: 'Meghalaya' },
                    { value: 'mizoram', label: 'Mizoram' },
                    { value: 'nagaland', label: 'Nagaland' },
                    { value: 'odisha', label: 'Odisha' },
                    { value: 'punjab', label: 'Punjab' },
                    { value: 'rajasthan', label: 'Rajasthan' },
                    { value: 'sikkim', label: 'Sikkim' },
                    { value: 'tamil-nadu', label: 'Tamil Nadu' },
                    { value: 'telangana', label: 'Telangana' },
                    { value: 'tripura', label: 'Tripura' },
                    { value: 'uttar-pradesh', label: 'Uttar Pradesh' },
                    { value: 'uttarakhand', label: 'Uttarakhand' },
                    { value: 'west-bengal', label: 'West Bengal' }
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

// Get single mate listing details
router.get('/:id', async (req, res) => {
    try {
        const mate = await PetMate.findById(req.params.id)
            .populate('listedBy', 'fullName email phoneNo')
            .lean();
        
        if (!mate) {
            return res.status(404).json({
                success: false,
                error: 'Mate listing not found'
            });
        }

        // Transform response to include image URLs
        const mateForResponse = {
            ...mate,
            imageCount: mate.images ? mate.images.length : 0,
            imageUrls: mate.images ? mate.images.map((_, index) => 
                `/images/mate/${mate._id}/${index}`
            ) : []
        };
        
        // Remove raw image data
        delete mateForResponse.images;

        res.json({
            success: true,
            data: {
                mate: mateForResponse
            }
        });
    } catch (err) {
        console.error('Error fetching mate details:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching mate details',
            message: err.message
        });
    }
});

// Add new mate listing (authenticated users only)
router.post('/add', isAuthenticated, upload.array('petImage', 4), async (req, res) => {
    try {
        console.log('=== MATE LISTING SUBMISSION ===');
        console.log('Request body:', req.body);
        console.log('Files received:', req.files ? req.files.length : 'none');
        console.log('User authenticated:', req.user ? req.user._id : 'NO USER');
        
        // Validate required fields
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one image is required'
            });
        }

        // Convert age to number
        const ageValue = parseFloat(req.body.ageValue);
        if (isNaN(ageValue) || !req.body.ageValue) {
            return res.status(400).json({
                success: false,
                error: 'Age value is required and must be a number'
            });
        }

        const ageUnit = req.body.ageUnit;
        if (!ageUnit) {
            return res.status(400).json({
                success: false,
                error: 'Age unit (months/years) is required'
            });
        }

        // Age validation
        if (ageUnit === 'months' && ageValue > 120) {
            return res.status(400).json({
                success: false,
                error: 'Maximum age in months is 120 (10 years)'
            });
        }
        if (ageUnit === 'years' && ageValue > 30) {
            return res.status(400).json({
                success: false,
                error: 'Maximum age in years is 30'
            });
        }

        // Handle breed (including "other" option)
        let breedValue = req.body.breed;
        if (breedValue === 'other' && req.body.breedOther) {
            breedValue = req.body.breedOther.toLowerCase().trim();
        }

        if (!breedValue) {
            return res.status(400).json({
                success: false,
                error: 'Breed is required'
            });
        }

        const mateData = {
            name: req.body.petName,
            petType: req.body.petType,
            breed: breedValue,
            age: {
                value: ageValue,
                unit: ageUnit
            },
            gender: req.body.gender,
            description: req.body.description,
            location: {
                state: req.body.state,
                district: req.body.district
            },
            contact: {
                phone: req.body.contactNumber,
                email: req.body.email || req.user.email
            },
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            })),
            registrationNumber: req.body.registrationNumber || '',
            healthChecked: req.body.healthCheck === 'on' || req.body.healthCheck === 'true',
            termsAccepted: req.body.terms === 'on' || req.body.terms === 'true',
            listedBy: req.user._id,
            createdAt: new Date()
        };

        console.log('Creating new mate listing with data:', {
            name: mateData.name,
            petType: mateData.petType,
            breed: mateData.breed,
            age: mateData.age,
            gender: mateData.gender
        });

        const newMate = await PetMate.create(mateData);
        console.log('Successfully created new mate listing with ID:', newMate._id);
        
        res.status(201).json({
            success: true,
            message: 'Mate listing created successfully',
            data: {
                mateId: newMate._id,
                name: newMate.name,
                petType: newMate.petType,
                breed: newMate.breed
            }
        });
    } catch (err) {
        console.error('Mate creation error:', err);
        console.error('Error stack:', err.stack);
        
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to create mate listing',
            message: err.message
        });
    }
});

// Get user's own mate listings
router.get('/my/listings', isAuthenticated, async (req, res) => {
    try {
        const listings = await PetMate.find({ listedBy: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        const listingsForResponse = listings.map(listing => ({
            ...listing,
            imageCount: listing.images ? listing.images.length : 0,
            imageUrls: listing.images ? listing.images.map((_, index) => 
                `/images/mate/${listing._id}/${index}`
            ) : []
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
        console.error('Error fetching user mate listings:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching your listings',
            message: err.message
        });
    }
});

// Update mate listing
router.patch('/:id', isAuthenticated, upload.array('petImage', 4), async (req, res) => {
    try {
        const mate = await PetMate.findById(req.params.id);

        if (!mate) {
            return res.status(404).json({
                success: false,
                error: 'Mate listing not found'
            });
        }

        // Check if user is the owner
        if (mate.listedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own listings'
            });
        }

        // Update fields if provided
        if (req.body.petName) mate.name = req.body.petName;
        if (req.body.description) mate.description = req.body.description;
        if (req.body.contactNumber) mate.contact.phone = req.body.contactNumber;
        if (req.body.email) mate.contact.email = req.body.email;
        if (req.body.registrationNumber !== undefined) mate.registrationNumber = req.body.registrationNumber;
        
        // Update images if new ones are provided
        if (req.files && req.files.length > 0) {
            mate.images = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
        }

        await mate.save();

        res.json({
            success: true,
            message: 'Mate listing updated successfully',
            data: {
                mateId: mate._id
            }
        });
    } catch (err) {
        console.error('Error updating mate listing:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update mate listing',
            message: err.message
        });
    }
});

// Delete mate listing
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const mate = await PetMate.findById(req.params.id);

        if (!mate) {
            return res.status(404).json({
                success: false,
                error: 'Mate listing not found'
            });
        }

        // Check if user is the owner
        if (mate.listedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own listings'
            });
        }

        await PetMate.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Mate listing deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting mate listing:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to delete mate listing',
            message: err.message
        });
    }
});

// Get mate image (binary data for <img> tags)
router.get('/image/:mateId/:index', async (req, res) => {
    try {
        const mate = await PetMate.findById(req.params.mateId);
        const imageIndex = parseInt(req.params.index);
        
        if (!mate || !mate.images || !mate.images[imageIndex]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }
        
        const image = mate.images[imageIndex];
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

module.exports = router;