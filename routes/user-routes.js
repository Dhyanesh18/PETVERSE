const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import Mongoose Models
const Pet = require('../models/pets');
const Product = require('../models/products');
const Service = require('../models/services');
const Cart = require('../models/cart');
const Review = require('../models/reviews');
// const User = require('../models/users');

// Common navigation links data
const navLinksData = [
    { name: 'Home', url: '/home' },
    { name: 'Pets', url: '/pets' },
    { 
        name: 'Products', 
        url: '#', // Changed from /products - This link only toggles the dropdown
        dropdown: true,
        dropdownItems: [
            { name: 'Pet Food', url: '/products/petfood' },
            { name: 'Toys', url: '/products/toys' },
            { name: 'Accessories', url: '/products/accessories' }
        ]
    },
    { 
        name: 'Services', 
        url: '#', // Changed from /services - This link only toggles the dropdown
        dropdown: true,
        dropdownItems: [
            { name: 'Pet Care', url: '/services' }, // Link to general services page
            { name: 'Pet Mate', url: '/mate' }
        ]
    },
    { name: 'About', url: '/about' }
];

// Home page
router.get('/home', auth, async (req, res) => { // Made async for future DB fetches
    try {
        // TODO: Fetch featured pets/products dynamically
        const featuredPets = []; // Placeholder
        const featuredProducts = []; // Placeholder

        res.render('homepage', {
            title: 'PetVerse - Your Pet Care Companion',
            iconPath: '/images/favicon.ico',
            siteName: 'PetVerse',
            loginUrl: '/login',
            navLinks: navLinksData,
            heroTitle: 'Perfect Pet',
            heroSubtitle: 'Find your furry friend and everything they need',
            heroButtonText: 'Adopt Now',
            slideshowTitle: 'Featured Pets',
            slides: [
                { image: '/images/slide1.jpg', caption: 'Adorable Puppies' },
                { image: '/images/slide2.jpg', caption: 'Playful Kittens' },
                { image: '/images/slide3.jpg', caption: 'Exotic Birds' }
            ],
            petSectionTitle: 'Search by Pet',
            petCategories: [
                { name: 'Dogs', image: '/images/dog.jpg' },
                { name: 'Cats', image: '/images/cat.jpg' },
                { name: 'Birds', image: '/images/bird.jpg' },
                { name: 'Fish', image: '/images/fish.jpg' }
            ],
            exploreButtonText: 'Explore',
            featuredPetsTitle: 'Featured Pets',
            featuredPets: featuredPets,
            detailsButtonText: 'View Details',
            featuredProductsTitle: 'Featured Products',
            featuredProducts: featuredProducts,
            buyButtonText: 'Buy Now',
            aboutTitle: 'About PetVerse',
            aboutText: [
                'Welcome to PetVerse, your one-stop destination for all things pets!',
                'We are dedicated to helping you find the perfect pet and providing everything they need to live a happy and healthy life.'
            ],
            featuresTitle: 'Why Choose Us',
            features: [
                { title: 'Quality Pets', description: 'Healthy and well-cared-for pets from trusted breeders' },
                { title: 'Premium Products', description: 'High-quality pet supplies and accessories' },
                { title: 'Expert Services', description: 'Professional pet care and grooming services' }
            ],
            testimonialTitle: 'What Our Customers Say',
            testimonials: [
                { text: 'Found my perfect companion here!', author: 'John D.' },
                { text: 'Great service and quality products', author: 'Sarah M.' },
                { text: 'Best place for pet lovers', author: 'Mike R.' }
            ],
            ctaTitle: 'Ready to Find Your Perfect Pet?',
            ctaSubtitle: 'Join our community of pet lovers today',
            ctaButtons: [
                { id: 'adopt', text: 'Adopt a Pet' },
                { id: 'shop', text: 'Shop Products' }
            ],
            footerTagline: 'Your Pet Care Companion',
            quickLinksTitle: 'Quick Links',
            footerLinks: [
                { name: 'Home', url: '/home' },
                { name: 'About', url: '/about' },
                { name: 'Contact', url: '/contact' },
                { name: 'Privacy Policy', url: '/privacy' }
            ],
            socialTitle: 'Follow Us',
            socialLinks: [
                { name: 'Facebook', url: '#' },
                { name: 'Twitter', url: '#' },
                { name: 'Instagram', url: '#' }
            ]
        });
    } catch (err) {
        console.error('Error fetching homepage data:', err);
        res.status(500).render('error', { message: 'Error loading homepage' });
    }
});

// Pets route
router.get('/pets', auth, async (req, res) => {
    try {
        const pets = await Pet.find({ available: true });
        const products = await Product.find({}); // Fetch all products
        res.render('pets', {
            navLinks: navLinksData,
            categoryTitle: 'Available Pets',
            pets: pets,
            products: products, // Pass products to the template
            // Static filters for now - could be fetched or derived
            categoryFilters: [
                { id: 'dogs', value: 'dogs', label: 'Dogs' },
                { id: 'cats', value: 'cats', label: 'Cats' },
                { id: 'birds', value: 'birds', label: 'Birds' },
                { id: 'fish', value: 'fish', label: 'Fish' }
            ],
            dynamicFilters: [
                {
                    title: 'Breed',
                    name: 'breed',
                    options: [
                        { id: 'german-shepherd', value: 'german-shepherd', label: 'German Shepherd' },
                        { id: 'golden-retriever', value: 'golden-retriever', label: 'Golden Retriever' },
                        { id: 'persian', value: 'persian', label: 'Persian' },
                        { id: 'siamese', value: 'siamese', label: 'Siamese' }
                    ]
                },
                {
                    title: 'Age',
                    name: 'age',
                    options: [
                        { id: 'puppy', value: 'puppy', label: 'Puppy/Kitten' },
                        { id: 'young', value: 'young', label: 'Young' },
                        { id: 'adult', value: 'adult', label: 'Adult' }
                    ]
                }
            ]
        });
    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).render('error', { message: 'Error fetching pets' });
    }
});

// Product routes Helper
async function renderProductPage(res, category, categoryTitle) {
    try {
        const page = parseInt(res.req.query.page) || 1;
        const limit = 6; // Items per page
        const skip = (page - 1) * limit;

        const query = category ? { category: category } : {};
        
        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        
        // Get products for current page
        const products = await Product.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.render('products', {
            navLinks: navLinksData,
            categoryTitle: categoryTitle,
            products: products,
            currentPage: page,
            totalPages: totalPages,
            // Static filters for now
            categoryFilters: [
                { id: 'petfood', value: 'Pet Food', label: 'Pet Food' },
                { id: 'toys', value: 'Toys', label: 'Toys' },
                { id: 'accessories', value: 'Accessories', label: 'Accessories' }
            ],
            brandFilters: [], // TODO: Populate dynamically
            ratingFilters: [], // TODO: Populate dynamically
            dynamicFilters: [] // TODO: Populate dynamically
        });
    } catch (err) {
        console.error(`Error fetching ${categoryTitle}:`, err);
        res.status(500).render('error', { message: `Error fetching ${categoryTitle}` });
    }
}

// Specific Product Routes (call helper)
router.get('/products', auth, (req, res) => { renderProductPage(res, null, 'All Products'); });
router.get('/products/petfood', auth, (req, res) => { renderProductPage(res, 'Pet Food', 'Pet Food'); });
router.get('/products/toys', auth, (req, res) => { renderProductPage(res, 'Toys', 'Pet Toys'); });
router.get('/products/accessories', auth, (req, res) => { renderProductPage(res, 'Accessories', 'Pet Accessories'); });

// Services route
router.get('/services', auth, async (req, res) => {
    try {
        const services = await Service.find();
        res.render('services', {
            navLinks: navLinksData,
            pageTitle: 'Pet Services',
            services: services
        });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).render('error', { message: 'Error fetching services' });
    }
});

// PetMate route
router.get('/mate', auth, async (req, res) => { // Made async for future DB fetch
    try {
        // TODO: Fetch mating listings dynamically
        const matingPets = []; // Placeholder
        res.render('mate', {
            navLinks: navLinksData,
             petTypes: [
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'bird', label: 'Bird' },
                { value: 'other', label: 'Other' }
            ],
            breeds: [
                { value: 'german-shepherd', label: 'German Shepherd' },
                { value: 'golden-retriever', label: 'Golden Retriever' },
                { value: 'labrador', label: 'Labrador' },
                { value: 'persian', label: 'Persian' },
                { value: 'siamese', label: 'Siamese' },
                { value: 'parrot', label: 'Parrot' },
                { value: 'cockatiel', label: 'Cockatiel' }
            ],
            states: [
                { value: 'maharashtra', label: 'Maharashtra' },
                { value: 'karnataka', label: 'Karnataka' },
                { value: 'tamil-nadu', label: 'Tamil Nadu' },
                { value: 'kerala', label: 'Kerala' },
                { value: 'delhi', label: 'Delhi' }
            ],
            pets: matingPets
        });
    } catch (err) {
        console.error('Error fetching mate data:', err);
        res.status(500).render('error', { message: 'Error loading PetMate page' });
    }
});

// About route
router.get('/about', auth, async (req, res) => { // Made async for future DB fetch
    try {
        // TODO: Fetch stats dynamically
         const teamMembers = [
             {
                 name: 'Dhyaneshvar K',
                 role: 'Member 1',
                 image: '/images/mem.jpg',
                 social: {
                     linkedin: '#',
                     twitter: '#',
                     instagram: '#'
                 }
             },
             {
                 name: 'Jeevan M',
                 role: 'Member 2',
                 image: '/images/mem.jpg',
                 social: {
                     linkedin: '#',
                     twitter: '#',
                     instagram: '#'
                 }
             },
             {
                 name: 'Suresh',
                 role: 'Member 3',
                 image: '/images/mem.jpg',
                 social: {
                     linkedin: '#',
                     twitter: '#',
                     instagram: '#'
                 }
             },
             {
                 name: 'Koushik',
                 role: 'Member 4',
                 image: '/images/mem.jpg',
                 social: {
                     linkedin: '#',
                     twitter: '#',
                     github: '#'
                 }
             },
             {
                 name: 'Charan',
                 role: 'Member 5',
                 image: '/images/mem.jpg',
                 social: {
                     linkedin: '#',
                     twitter: '#',
                     github: '#'
                 }
             }
         ];
        res.render('about', {
            navLinks: navLinksData,
            activeUsers: 10000,
            activeSellers: 500,
            activeServiceProviders: 300,
            petsAvailable: 2000,
            teamMembers: teamMembers
        });
    } catch (err) {
        console.error('Error fetching about data:', err);
        res.status(500).render('error', { message: 'Error loading About page' });
    }
});

// Cart route
router.get('/cart', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate('items.productId');

        // If no cart exists, create one
        if (!cart) {
            const newCart = new Cart({
                userId: req.session.userId,
                items: []
            });
            await newCart.save();
            return res.render('cart', {
                navLinks: navLinksData,
                pageTitle: 'Shopping Cart',
                cart: newCart,
                products: []
            });
        }

        // Transform cart items into products array and clean up invalid items
        cart.items = cart.items.filter(item => item.productId); // Remove invalid items from cart
        await cart.save(); // Save the cleaned cart
        const products = cart.items.map(item => ({
            id: item.productId._id,
            title: item.productId.name,
            price: item.productId.price,
            image_url: item.productId.image_url,
            quantity: item.quantity
        }));

        res.render('cart', {
            navLinks: navLinksData,
            pageTitle: 'Shopping Cart',
            cart: cart,
            products: products
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).render('error', { message: 'Error loading cart' });
    }
});

// Cart count route (separate from cart page)
router.get('/cart/count', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        const cartCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
        
        res.json({
            success: true,
            cartCount
        });
    } catch (err) {
        console.error('Error getting cart count:', err);
        res.status(500).json({
            success: false,
            error: 'Server error while getting cart count'
        });
    }
});

// Add to cart
router.post('/cart/add', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                error: 'Product ID and quantity are required'
            });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            cart = new Cart({
                userId: req.session.userId,
                items: []
            });
        }

        const existingItem = cart.items.find(item => 
            item.productId.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                quantity
            });
        }

        await cart.save();

        res.json({
            success: true,
            cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
        });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({
            success: false,
            error: 'Server error while adding to cart'
        });
    }
});

// Remove from cart route
router.post('/cart/remove', auth, async (req, res) => {
    try {
        const { productId } = req.body;
        
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }
        
        cart.items = cart.items.filter(item => 
            item.productId.toString() !== productId
        );
        
        await cart.save();
        
        // Update cart count in session
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        req.session.cartCount = totalItems;
        
        res.json({ success: true, cartCount: totalItems });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({ success: false, error: 'Error removing from cart' });
    }
});

// Update cart quantity route
router.post('/cart/update', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }
        
        const item = cart.items.find(item => 
            item.productId.toString() === productId
        );
        
        if (item) {
            item.quantity = parseInt(quantity);
            await cart.save();
            
            // Update cart count in session
            const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            req.session.cartCount = totalItems;
            
            res.json({ success: true, cartCount: totalItems });
        } else {
            res.status(404).json({ success: false, error: 'Item not found in cart' });
        }
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({ success: false, error: 'Error updating cart' });
    }
});

// Booking page
router.get('/booking', auth, (req, res) => {
    // TODO: Add data needed for booking page if any
    res.render('booking', {
         navLinks: navLinksData, // Add navLinks here too
         // Add any other required data for booking.ejs
    });
});

// Buy page route
router.get('/buy/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'businessName email phone');
        
        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        // Get seller reviews and calculate average rating
        const sellerReviews = await Review.aggregate([
            {
                $match: {
                    targetType: 'Seller',
                    targetId: product.seller._id
                }
            },
            {
                $group: {
                    _id: '$targetId',
                    avgRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        const sellerRating = sellerReviews[0]?.avgRating?.toFixed(1) || 0;
        const sellerReviewCount = sellerReviews[0]?.reviewCount || 0;

        // Find similar products (same category, different brand)
        const similarProducts = await Product.find({
            category: product.category,
            brand: { $ne: product.brand },
            _id: { $ne: product._id }
        }).limit(4);

        res.render('Buy', {
            navLinks: navLinksData,
            product: product,
            seller: {
                ...product.seller.toObject(),
                rating: sellerRating,
                reviewCount: sellerReviewCount
            },
            similarProducts: similarProducts,
            isAuthenticated: true
        });
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).render('error', { message: 'Error loading product details' });
    }
});

// Checkout route
router.get('/checkout', auth, (req, res) => {
    res.render('checkout', {
        navLinks: navLinksData
    });
});

module.exports = router; 