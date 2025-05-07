const Pet = require('../models/pets');
const User = require('../models/users');

// Create new pet listing
exports.createPet = async (req, res) => {
    try {
        // Basic validation
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'At least one image is required' 
            });
        }

        const petData = {
            ...req.body,
            addedBy: req.user._id,
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }))
        };

        const newPet = await Pet.create(petData);
        
        res.status(201).json({
            success: true,
            message: 'Pet listing created successfully',
            pet: newPet
        });
    } catch (err) {
        console.error('Pet creation error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get all pets (with filters)
exports.getAllPets = async (req, res) => {
    try {
        const { category, available } = req.query;
        const filter = {};
        
        if (category) filter.category = category;
        if (available) filter.available = available === 'true';

        const pets = await Pet.find(filter)
            .populate('addedBy', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pets.length,
            pets
        });
    } catch (err) {
        console.error('Get pets error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get single pet by ID
exports.getPetById = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id)
            .populate('addedBy', 'username phone');

        if (!pet) {
            return res.status(404).render('error', { message: 'Pet not found' });
        }

        // Find similar pets (same category, different id)
        const similarPets = await Pet.find({ 
            category: pet.category,
            _id: { $ne: pet._id },
            available: true
        }).limit(4);

        // Render the pet detail view
        res.render('detail', {
            product: {
                name: pet.name,
                image: pet.images && pet.images.length > 0 ? 
                    `data:${pet.images[0].contentType};base64,${pet.images[0].data.toString('base64')}` : 
                    '/images/default-pet.jpg',
                price: pet.price,
                description: pet.description || 'No description available',
                category: pet.category,
                breed: pet.breed,
                age: pet.age,
                gender: pet.gender,
                regularPrice: null, // Pets don't have regular/discount prices typically
                isLightningDeal: false,
                deliveryEstimate: '3-5 days',
                seller: pet.addedBy ? {
                    username: pet.addedBy.username,
                    phone: pet.addedBy.phone
                } : null,
                isPet: true // Add a flag to identify as a pet in the template
            },
            similarProducts: similarPets.map(p => ({
                _id: p._id,
                name: p.name,
                image: p.images && p.images.length > 0 ? 
                    `data:${p.images[0].contentType};base64,${p.images[0].data.toString('base64')}` : 
                    '/images/default-pet.jpg',
                price: p.price,
                description: p.description || 'No description available'
            }))
        });
    } catch (err) {
        console.error('Get pet error:', err);
        res.status(500).render('error', { message: 'Server error' });
    }
};

// Update pet listing
exports.updatePet = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check ownership
        if (pet.addedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this listing'
            });
        }

        const updates = { ...req.body };
        
        // Handle image updates if provided
        if (req.files && req.files.length > 0) {
            updates.images = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
        }

        const updatedPet = await Pet.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Pet updated successfully',
            pet: updatedPet
        });
    } catch (err) {
        console.error('Update pet error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Delete pet listing
exports.deletePet = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check ownership
        if (pet.addedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this listing'
            });
        }

        await pet.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Pet listing deleted successfully'
        });
    } catch (err) {
        console.error('Delete pet error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get pet image
exports.getPetImage = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.petId);
        const imageIndex = parseInt(req.params.index);
        
        if (!pet || !pet.images[imageIndex]) {
            return res.status(404).send('Image not found');
        }
        
        const image = pet.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.send(image.data);
    } catch (err) {
        console.error('Get pet image error:', err);
        res.status(500).send('Server error');
    }
};