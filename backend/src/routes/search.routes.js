const express = require('express');
const router = express.Router();

const Pet = require('../models/pets');
const Product = require('../models/products');
const User = require('../models/users');
const Event = require('../models/event');
const PetMate = require('../models/petMate');

// Reusable search helper with enhanced capabilities
async function searchAllCollections(query, limit = 10, options = {}) {
    const regex = new RegExp(query, 'i'); // case-insensitive search
    
    const searchPromises = [];
    const results = {};

    // Search Pets
    if (!options.exclude || !options.exclude.includes('pets')) {
        searchPromises.push(
            Pet.find({ 
                $or: [
                    { name: regex }, 
                    { breed: regex }, 
                    { category: regex },
                    { description: regex }
                ],
                available: true
            })
            .populate('addedBy', 'fullName businessName')
            .limit(limit)
            .lean()
            .then(pets => {
                results.pets = pets.map(pet => ({
                    _id: pet._id,
                    name: pet.name,
                    breed: pet.breed,
                    category: pet.category,
                    price: pet.price,
                    age: pet.age,
                    gender: pet.gender,
                    thumbnail: pet.images && pet.images.length > 0 
                        ? `/images/pet/${pet._id}/0` 
                        : null,
                    type: 'pet',
                    url: `/pets/${pet._id}`
                }));
            })
        );
    }

    // Search Products
    if (!options.exclude || !options.exclude.includes('products')) {
        searchPromises.push(
            Product.find({ 
                $or: [
                    { name: regex }, 
                    { brand: regex }, 
                    { category: regex },
                    { description: regex }
                ],
                isActive: true
            })
            .populate('seller', 'fullName businessName')
            .limit(limit)
            .lean()
            .then(products => {
                results.products = products.map(product => {
                    const discountedPrice = product.discount > 0
                        ? product.price * (1 - product.discount / 100)
                        : product.price;
                    
                    return {
                        _id: product._id,
                        name: product.name,
                        brand: product.brand,
                        category: product.category,
                        price: product.price,
                        discount: product.discount || 0,
                        discountedPrice: discountedPrice.toFixed(2),
                        stock: product.stock,
                        thumbnail: product.images && product.images.length > 0 
                            ? `/images/product/${product._id}/0` 
                            : null,
                        type: 'product',
                        url: `/products/${product._id}`
                    };
                });
            })
        );
    }

    // Search Service Providers
    if (!options.exclude || !options.exclude.includes('services')) {
        searchPromises.push(
            User.find({
                role: 'service_provider',
                $or: [
                    { fullName: regex },
                    { serviceType: regex },
                    { serviceAddress: regex },
                    { serviceDescription: regex }
                ]
            })
            .select('fullName serviceType serviceAddress serviceDescription experienceYears')
            .limit(limit)
            .lean()
            .then(services => {
                results.services = services.map(service => ({
                    _id: service._id,
                    name: service.fullName,
                    serviceType: service.serviceType,
                    address: service.serviceAddress,
                    description: service.serviceDescription,
                    experience: service.experienceYears,
                    thumbnail: service.profilePicture 
                        ? `/images/user/${service._id}/profile` 
                        : null,
                    type: 'service',
                    url: `/services/${service._id}`
                }));
            })
        );
    }

    // Search Events
    if (!options.exclude || !options.exclude.includes('events')) {
        searchPromises.push(
            Event.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { tags: regex }
                ],
                eventDate: { $gte: new Date() },
                status: 'upcoming'
            })
            .populate('organizer', 'fullName')
            .limit(limit)
            .lean()
            .then(events => {
                results.events = events.map(event => ({
                    _id: event._id,
                    title: event.title,
                    description: event.description,
                    category: event.category,
                    eventDate: event.eventDate,
                    location: event.location,
                    entryFee: event.entryFee,
                    availableSlots: event.maxAttendees - event.attendees.length,
                    thumbnail: event.images && event.images.length > 0 
                        ? `/images/event/${event._id}/0` 
                        : null,
                    type: 'event',
                    url: `/events/${event._id}`
                }));
            })
        );
    }

    // Search Mate Listings
    if (!options.exclude || !options.exclude.includes('mates')) {
        searchPromises.push(
            PetMate.find({
                $or: [
                    { name: regex },
                    { breed: regex },
                    { petType: regex },
                    { description: regex }
                ]
            })
            .populate('listedBy', 'fullName')
            .limit(limit)
            .lean()
            .then(mates => {
                results.mates = mates.map(mate => ({
                    _id: mate._id,
                    name: mate.name,
                    breed: mate.breed,
                    petType: mate.petType,
                    age: mate.age,
                    gender: mate.gender,
                    location: mate.location,
                    thumbnail: mate.images && mate.images.length > 0 
                        ? `/images/mate/${mate._id}/0` 
                        : null,
                    type: 'mate',
                    url: `/mate/${mate._id}`
                }));
            })
        );
    }

    await Promise.all(searchPromises);
    return results;
}

// Global search API endpoint (searches all collections)
router.get('/', async (req, res) => {
    try {
        const { q, term, limit = 10, exclude } = req.query;
        const query = q || term;

        if (!query || query.trim() === '') {
            return res.json({
                success: true,
                data: {
                    query: '',
                    pets: [],
                    products: [],
                    services: [],
                    events: [],
                    mates: [],
                    totalResults: 0
                }
            });
        }

        const excludeArray = exclude ? exclude.split(',') : [];
        const results = await searchAllCollections(query, parseInt(limit), { 
            exclude: excludeArray 
        });

        // Calculate total results
        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

        res.json({
            success: true,
            data: {
                query: query.trim(),
                ...results,
                totalResults,
                resultCounts: {
                    pets: results.pets?.length || 0,
                    products: results.products?.length || 0,
                    services: results.services?.length || 0,
                    events: results.events?.length || 0,
                    mates: results.mates?.length || 0
                }
            }
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: err.message
        });
    }
});

// Quick search API (for autocomplete/search bar suggestions - limited results)
router.get('/quick', async (req, res) => {
    try {
        const { q, term } = req.query;
        const query = q || term;

        if (!query || query.trim() === '') {
            return res.json({
                success: true,
                data: {
                    suggestions: []
                }
            });
        }

        // Get only 3 results per category for quick suggestions
        const results = await searchAllCollections(query, 3);

        // Flatten and combine all results with type info
        const suggestions = [];

        if (results.pets) {
            results.pets.forEach(item => suggestions.push({
                ...item,
                categoryLabel: 'Pet',
                icon: '🐾'
            }));
        }

        if (results.products) {
            results.products.forEach(item => suggestions.push({
                ...item,
                categoryLabel: 'Product',
                icon: '🛒'
            }));
        }

        if (results.services) {
            results.services.forEach(item => suggestions.push({
                ...item,
                categoryLabel: 'Service',
                icon: '💼'
            }));
        }

        if (results.events) {
            results.events.forEach(item => suggestions.push({
                ...item,
                categoryLabel: 'Event',
                icon: '📅'
            }));
        }

        if (results.mates) {
            results.mates.forEach(item => suggestions.push({
                ...item,
                categoryLabel: 'Mate',
                icon: '💕'
            }));
        }

        res.json({
            success: true,
            data: {
                query: query.trim(),
                suggestions: suggestions.slice(0, 10), // Limit to 10 total suggestions
                hasMore: suggestions.length > 10
            }
        });
    } catch (err) {
        console.error('Quick search error:', err);
        res.status(500).json({
            success: false,
            error: 'Quick search failed',
            message: err.message
        });
    }
});

// Search specific category only
router.get('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { q, term, limit = 20, page = 1 } = req.query;
        const query = q || term;

        // Validate category
        const validCategories = ['pets', 'products', 'services', 'events', 'mates'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category',
                validCategories
            });
        }

        if (!query || query.trim() === '') {
            return res.json({
                success: true,
                data: {
                    query: '',
                    category,
                    results: [],
                    pagination: {
                        total: 0,
                        page: 1,
                        limit: parseInt(limit),
                        totalPages: 0
                    }
                }
            });
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const regex = new RegExp(query, 'i');

        let results = [];
        let total = 0;

        // Search based on category
        if (category === 'pets') {
            total = await Pet.countDocuments({
                $or: [
                    { name: regex }, 
                    { breed: regex }, 
                    { category: regex },
                    { description: regex }
                ],
                available: true
            });

            const pets = await Pet.find({
                $or: [
                    { name: regex }, 
                    { breed: regex }, 
                    { category: regex },
                    { description: regex }
                ],
                available: true
            })
            .populate('addedBy', 'fullName businessName')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

            results = pets.map(pet => ({
                _id: pet._id,
                name: pet.name,
                breed: pet.breed,
                category: pet.category,
                price: pet.price,
                age: pet.age,
                gender: pet.gender,
                thumbnail: pet.images && pet.images.length > 0 
                    ? `/images/pet/${pet._id}/0` 
                    : null,
                url: `/pets/${pet._id}`
            }));
        } else if (category === 'products') {
            total = await Product.countDocuments({
                $or: [
                    { name: regex }, 
                    { brand: regex }, 
                    { category: regex },
                    { description: regex }
                ],
                isActive: true
            });

            const products = await Product.find({
                $or: [
                    { name: regex }, 
                    { brand: regex }, 
                    { category: regex },
                    { description: regex }
                ],
                isActive: true
            })
            .populate('seller', 'fullName businessName')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

            results = products.map(product => {
                const discountedPrice = product.discount > 0
                    ? product.price * (1 - product.discount / 100)
                    : product.price;
                
                return {
                    _id: product._id,
                    name: product.name,
                    brand: product.brand,
                    category: product.category,
                    price: product.price,
                    discount: product.discount || 0,
                    discountedPrice: discountedPrice.toFixed(2),
                    stock: product.stock,
                    thumbnail: product.images && product.images.length > 0 
                        ? `/images/product/${product._id}/0` 
                        : null,
                    url: `/products/${product._id}`
                };
            });
        } else if (category === 'services') {
            total = await User.countDocuments({
                role: 'service_provider',
                $or: [
                    { fullName: regex },
                    { serviceType: regex },
                    { serviceAddress: regex },
                    { serviceDescription: regex }
                ]
            });

            const services = await User.find({
                role: 'service_provider',
                $or: [
                    { fullName: regex },
                    { serviceType: regex },
                    { serviceAddress: regex },
                    { serviceDescription: regex }
                ]
            })
            .select('fullName serviceType serviceAddress serviceDescription experienceYears')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

            results = services.map(service => ({
                _id: service._id,
                name: service.fullName,
                serviceType: service.serviceType,
                address: service.serviceAddress,
                description: service.serviceDescription,
                experience: service.experienceYears,
                thumbnail: service.profilePicture 
                    ? `/images/user/${service._id}/profile` 
                    : null,
                url: `/services/${service._id}`
            }));
        } else if (category === 'events') {
            total = await Event.countDocuments({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { tags: regex }
                ],
                eventDate: { $gte: new Date() },
                status: 'upcoming'
            });

            const events = await Event.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { tags: regex }
                ],
                eventDate: { $gte: new Date() },
                status: 'upcoming'
            })
            .populate('organizer', 'fullName')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

            results = events.map(event => ({
                _id: event._id,
                title: event.title,
                description: event.description,
                category: event.category,
                eventDate: event.eventDate,
                location: event.location,
                entryFee: event.entryFee,
                availableSlots: event.maxAttendees - event.attendees.length,
                thumbnail: event.images && event.images.length > 0 
                    ? `/images/event/${event._id}/0` 
                    : null,
                url: `/events/${event._id}`
            }));
        } else if (category === 'mates') {
            total = await PetMate.countDocuments({
                $or: [
                    { name: regex },
                    { breed: regex },
                    { petType: regex },
                    { description: regex }
                ]
            });

            const mates = await PetMate.find({
                $or: [
                    { name: regex },
                    { breed: regex },
                    { petType: regex },
                    { description: regex }
                ]
            })
            .populate('listedBy', 'fullName')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

            results = mates.map(mate => ({
                _id: mate._id,
                name: mate.name,
                breed: mate.breed,
                petType: mate.petType,
                age: mate.age,
                gender: mate.gender,
                location: mate.location,
                thumbnail: mate.images && mate.images.length > 0 
                    ? `/images/mate/${mate._id}/0` 
                    : null,
                url: `/mate/${mate._id}`
            }));
        }

        res.json({
            success: true,
            data: {
                query: query.trim(),
                category,
                results,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (err) {
        console.error(`Search ${req.params.category} error:`, err);
        res.status(500).json({
            success: false,
            error: 'Category search failed',
            message: err.message
        });
    }
});

module.exports = router;