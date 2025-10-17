const PetMate = require('../models/petMate');
const User = require('../models/users');

exports.showMatePage = async (req, res) => {
    try {
        console.log('Fetching pets from database...');
        
        // Get all pets without filtering for initial page load
        const pets = await PetMate.find({}).lean();
        
        console.log('Number of pets fetched:', pets.length);
        if (pets.length > 0) {
            console.log('First pet data:', JSON.stringify(pets[0], null, 2));
        } else {
            console.log('No pets found in database');
        }

        const breeds = [
            { value: 'german-shepherd', label: 'German Shepherd' },
            { value: 'asdasd', label: 'Asdasd' },
            { value: 'persian', label: 'Persian' },
            { value: 'siamese', label: 'Siamese' }
        ];

        res.render('mate', {
            pets: pets,
            petTypes: [
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'bird', label: 'Bird' },
                { value: 'other', label: 'Other' }
            ],
            states: [
                { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
                { value: 'kerala', label: 'Kerala' },
                { value: 'karnataka', label: 'Karnataka' },
                { value: 'tamil-nadu', label: 'Tamil Nadu' },
                { value: 'telangana', label: 'Telangana' }
            ],
            breeds: breeds,
            selectedFilters: {},
            currentPage: 1,
            totalPages: 1,
            formData: null,
            error: null
        });
    } catch (err) {
        console.error('Error loading mate page:', err);
        res.status(500).render('error', { message: 'Error loading page' });
    }
};

// NEW FUNCTION - API endpoint for filtering pets dynamically
exports.filterPets = async (req, res) => {
    try {
        const { petType, gender, breed, age, state, district } = req.query;
        
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
            // Use case-insensitive regex for breed matching
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
        
        console.log('Filter query:', JSON.stringify(query));
        
        const pets = await PetMate.find(query).lean();
        
        console.log(`Found ${pets.length} pets matching filters`);
        
        // Convert image buffers to base64 strings for JSON response
        const petsWithBase64Images = pets.map(pet => {
            if (pet.images && pet.images.length > 0) {
                pet.images = pet.images.map(img => ({
                    contentType: img.contentType,
                    dataBase64: Buffer.from(img.data.buffer || img.data).toString('base64')
                }));
            }
            return pet;
        });
        
        res.json({
            success: true,
            pets: petsWithBase64Images,
            count: petsWithBase64Images.length
        });
    } catch (err) {
        console.error('Error filtering pets:', err);
        res.status(500).json({
            success: false,
            message: 'Error filtering pets',
            error: err.message
        });
    }
};

exports.addMateListing = async (req, res) => {
    try {
        console.log('Received form submission:', req.body);
        console.log('Files received:', req.files ? req.files.length : 'none');
        
        // Validate required fields
        if (!req.files || req.files.length === 0) {
            throw new Error('At least one image is required');
        }

        // Convert age to number
        const ageValue = parseFloat(req.body.ageValue);
        if (isNaN(ageValue)) {
            throw new Error('Invalid age value');
        }

        // Age validation
        const ageUnit = req.body.ageUnit;
        if (ageUnit === 'months' && ageValue > 120) {
            throw new Error('Maximum age in months is 120 (10 years)');
        }
        if (ageUnit === 'years' && ageValue > 30) {
            throw new Error('Maximum age in years is 30');
        }

        const mateData = {
            name: req.body.petName,
            petType: req.body.petType,
            breed: req.body.breed,
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
                email: req.body.email
            },
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            })),
            registrationNumber: req.body.registrationNumber || '',
            healthChecked: req.body.healthCheck === 'on',
            termsAccepted: req.body.terms === 'on',
            listedBy: req.user._id,
            createdAt: new Date() // Ensure creation date is set
        };

        console.log('Creating new mate listing with data:', JSON.stringify({
            name: mateData.name,
            petType: mateData.petType,
            breed: mateData.breed
        }, null, 2));

        const newMate = await PetMate.create(mateData);
        console.log('Successfully created new mate listing with ID:', newMate._id);
        
        res.redirect('/mate');
    } catch (err) {
        console.error('Mate creation error:', err);
        
        // Get existing mates to maintain page state
        const mates = await PetMate.find().sort({ createdAt: -1 });
        
        res.status(400).render('mate', {
            error: err.message,
            pets: mates,
            formData: req.body, // Preserve form input
            petTypes: [
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'bird', label: 'Bird' },
                { value: 'other', label: 'Other' }
            ],
            states: [
                { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
                { value: 'kerala', label: 'Kerala' },
                { value: 'karnataka', label: 'Karnataka' },
                { value: 'tamil-nadu', label: 'Tamil Nadu' },
                { value: 'telangana', label: 'Telangana' }
            ],
            breeds: [
                { value: 'german-shepherd', label: 'German Shepherd' },
                { value: 'persian', label: 'Persian' },
                { value: 'siamese', label: 'Siamese' }
            ]
        });
    }
};

exports.getMateImage = async (req, res) => {
    try {
        const mate = await PetMate.findById(req.params.mateId);
        const imageIndex = parseInt(req.params.index);
        
        if (!mate || !mate.images[imageIndex]) {
            return res.status(404).send('Image not found');
        }
        
        const image = mate.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.send(image.data);
    } catch (err) {
        console.error('Image load error:', err);
        res.status(500).send('Server error');
    }
};

exports.addMateListing = async (req, res) => {
    try {
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Files received:', req.files ? req.files.length : 'none');
        console.log('User authenticated:', req.user ? req.user._id : 'NO USER');
        
        // Check authentication
        if (!req.user) {
            return res.status(401).render('mate', {
                error: 'You must be logged in to list a pet',
                pets: await PetMate.find().lean(),
                formData: req.body,
                petTypes: [
                    { value: 'dog', label: 'Dog' },
                    { value: 'cat', label: 'Cat' },
                    { value: 'bird', label: 'Bird' },
                    { value: 'other', label: 'Other' }
                ],
                states: [
                    { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
                    { value: 'kerala', label: 'Kerala' },
                    { value: 'karnataka', label: 'Karnataka' },
                    { value: 'tamil-nadu', label: 'Tamil Nadu' },
                    { value: 'telangana', label: 'Telangana' }
                ],
                breeds: [
                    { value: 'german-shepherd', label: 'German Shepherd' },
                    { value: 'persian', label: 'Persian' },
                    { value: 'siamese', label: 'Siamese' }
                ],
                selectedFilters: {},
                currentPage: 1,
                totalPages: 1
            });
        }
        
        // Validate required fields
        if (!req.files || req.files.length === 0) {
            throw new Error('At least one image is required');
        }

        // Convert age to number
        const ageValue = parseFloat(req.body.ageValue);
        if (isNaN(ageValue) || !req.body.ageValue) {
            throw new Error('Age value is required and must be a number');
        }

        const ageUnit = req.body.ageUnit;
        if (!ageUnit) {
            throw new Error('Age unit (months/years) is required');
        }

        // Age validation
        if (ageUnit === 'months' && ageValue > 120) {
            throw new Error('Maximum age in months is 120 (10 years)');
        }
        if (ageUnit === 'years' && ageValue > 30) {
            throw new Error('Maximum age in years is 30');
        }

        // Handle breed (including "other" option)
        let breedValue = req.body.breed;
        if (breedValue === 'other' && req.body.breedOther) {
            breedValue = req.body.breedOther.toLowerCase().trim();
        }

        if (!breedValue) {
            throw new Error('Breed is required');
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
                email: req.body.email
            },
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            })),
            registrationNumber: req.body.registrationNumber || '',
            healthChecked: req.body.healthCheck === 'on',
            termsAccepted: req.body.terms === 'on',
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
        
        res.redirect('/pets/mate?success=true');
    } catch (err) {
        console.error('Mate creation error:', err);
        console.error('Error stack:', err.stack);
        
        // Get existing mates to maintain page state
        const mates = await PetMate.find().sort({ createdAt: -1 }).lean();
        
        res.status(400).render('mate', {
            error: err.message,
            pets: mates,
            formData: req.body,
            petTypes: [
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'bird', label: 'Bird' },
                { value: 'other', label: 'Other' }
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

            breeds: [
                { value: 'german-shepherd', label: 'German Shepherd' },
                { value: 'labrador', label: 'Labrador' },
                { value: 'persian', label: 'Persian' },
                { value: 'siamese', label: 'Siamese' }
            ],
            selectedFilters: {},
            currentPage: 1,
            totalPages: 1
        });
    }
};