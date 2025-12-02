const LostPet = require('../models/lostPet');

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};

// Create lost pet post
exports.createLostPet = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required'
            });
        }

        const lostPetData = {
            ...req.body,
            lastSeenLocation: {
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                coordinates: {
                    latitude: parseFloat(req.body.latitude),
                    longitude: parseFloat(req.body.longitude)
                }
            },
            contactInfo: {
                name: req.body.contactName,
                phone: req.body.contactPhone,
                email: req.body.contactEmail,
                alternatePhone: req.body.alternatePhone
            },
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            })),
            postedBy: req.user._id
        };

        const newLostPet = await LostPet.create(lostPetData);

        res.status(201).json({
            success: true,
            message: 'Lost pet post created successfully',
            data: newLostPet
        });
    } catch (err) {
        console.error('Create lost pet error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get all lost pets with proximity filtering
exports.getAllLostPets = async (req, res) => {
    try {
        const { 
            latitude, 
            longitude, 
            radius = 50, // default 50km
            status = 'lost',
            petType,
            page = 1,
            limit = 12
        } = req.query;

        let query = { isActive: true };

        if (status) {
            query.status = status;
        }

        if (petType) {
            query.petType = petType;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let lostPets = await LostPet.find(query)
            .populate('postedBy', 'fullName username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Calculate distance if user coordinates provided
        if (latitude && longitude) {
            const userLat = parseFloat(latitude);
            const userLon = parseFloat(longitude);
            const maxRadius = parseFloat(radius);

            lostPets = lostPets.map(pet => {
                const distance = calculateDistance(
                    userLat,
                    userLon,
                    pet.lastSeenLocation.coordinates.latitude,
                    pet.lastSeenLocation.coordinates.longitude
                );

                return {
                    ...pet,
                    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                    isNearby: distance <= maxRadius
                };
            });

            // Sort by distance
            lostPets.sort((a, b) => a.distance - b.distance);

            // Filter by radius if specified
            if (radius) {
                lostPets = lostPets.filter(pet => pet.isNearby);
            }
        }

        const total = await LostPet.countDocuments(query);

        res.json({
            success: true,
            data: {
                lostPets,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error('Get lost pets error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get single lost pet by ID
exports.getLostPetById = async (req, res) => {
    try {
        const lostPet = await LostPet.findById(req.params.id)
            .populate('postedBy', 'fullName username email phone')
            .populate('comments.user', 'fullName username');

        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        // Increment views
        lostPet.views += 1;
        await lostPet.save();

        // Calculate distance if user coordinates provided
        const { latitude, longitude } = req.query;
        let distance = null;

        if (latitude && longitude) {
            distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                lostPet.lastSeenLocation.coordinates.latitude,
                lostPet.lastSeenLocation.coordinates.longitude
            );
            distance = Math.round(distance * 10) / 10;
        }

        res.json({
            success: true,
            data: {
                ...lostPet.toObject(),
                distance
            }
        });
    } catch (err) {
        console.error('Get lost pet error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Update lost pet post
exports.updateLostPet = async (req, res) => {
    try {
        const lostPet = await LostPet.findById(req.params.id);

        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        // Check ownership
        if (lostPet.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this post'
            });
        }

        const updates = { ...req.body };

        // Handle images if provided
        if (req.files && req.files.length > 0) {
            updates.images = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
        }

        const updatedLostPet = await LostPet.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Lost pet post updated successfully',
            data: updatedLostPet
        });
    } catch (err) {
        console.error('Update lost pet error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Update status (mark as found/reunited)
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const lostPet = await LostPet.findById(req.params.id);

        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        // Check ownership
        if (lostPet.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this post'
            });
        }

        lostPet.status = status;
        if (status === 'reunited') {
            lostPet.isActive = false;
        }

        await lostPet.save();

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            data: lostPet
        });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Add comment
exports.addComment = async (req, res) => {
    try {
        const { message } = req.body;
        const lostPet = await LostPet.findById(req.params.id);

        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        lostPet.comments.push({
            user: req.user._id,
            message,
            createdAt: new Date()
        });

        await lostPet.save();

        const populatedLostPet = await LostPet.findById(req.params.id)
            .populate('comments.user', 'fullName username');

        res.json({
            success: true,
            message: 'Comment added successfully',
            data: populatedLostPet.comments
        });
    } catch (err) {
        console.error('Add comment error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Delete lost pet post
exports.deleteLostPet = async (req, res) => {
    try {
        const lostPet = await LostPet.findById(req.params.id);

        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        // Check ownership
        if (lostPet.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this post'
            });
        }

        await LostPet.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Lost pet post deleted successfully'
        });
    } catch (err) {
        console.error('Delete lost pet error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get user's lost pet posts
exports.getUserLostPets = async (req, res) => {
    try {
        const lostPets = await LostPet.find({ postedBy: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: lostPets
        });
    } catch (err) {
        console.error('Get user lost pets error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get lost pet image
exports.getLostPetImage = async (req, res) => {
    try {
        const lostPet = await LostPet.findById(req.params.id);
        const imageIndex = parseInt(req.params.index);

        if (!lostPet || !lostPet.images[imageIndex]) {
            return res.status(404).send('Image not found');
        }

        const image = lostPet.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (err) {
        console.error('Get image error:', err);
        res.status(500).send('Server error');
    }
};
