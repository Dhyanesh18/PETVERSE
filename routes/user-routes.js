const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Import Mongoose Models
const Pet = require('../models/pets');
const Product = require('../models/products');
const Service = require('../models/serviceProvider');
const Cart = require('../models/cart');
const Review = require('../models/reviews');
const User = require('../models/users');
const Order = require('../models/order');
const Booking = require('../models/Booking');
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
router.get('/home', isAuthenticated, async (req, res) => { // Made async for future DB fetches
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

// Owner Dashboard route
router.get('/owner-dashboard', isAuthenticated, async (req, res) => {
    try {
        // Check if user is an owner
        if (req.user.role !== 'owner') {
            return res.status(403).render('error', {
                message: 'Access denied. This dashboard is for pet owners only.'
            });
        }

        // Get mock data for dashboard or retrieve actual user data
        const userData = {
            username: req.user.username,
            email: req.user.email,
            phone: req.user.phone,
            address: req.user.address || 'Not provided',
            joinedDate: new Date(req.user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            lastLogin: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            totalOrders: 0,
            activeOrders: 0,
            totalSpent: 0,
            wishlistItems: 0
        };

        // Mock order data - replace with actual data when available
        const mockOrders = [];
        
        // Fetch user's bookings
        const bookings = await Booking.find({ user: req.user._id })
            .populate('service')
            .sort({ date: 1 })
            .lean();
            
        // Format the bookings for display
        const formattedBookings = bookings.map(booking => ({
            id: booking._id,
            serviceName: booking.service?.name || 'Service Unavailable',
            serviceType: booking.service?.type || 'Unknown',
            date: booking.date,
            time: booking.slot,
            status: 'Confirmed'  // You can add actual status logic here
        }));
        
        res.render('owner-dashboard', {
            user: userData,
            orders: mockOrders,
            bookings: formattedBookings || [],
            navLinks: navLinksData
        });
    } catch (err) {
        console.error('Error loading owner dashboard:', err);
        res.status(500).render('error', { 
            message: 'Error loading dashboard. Please try again later.' 
        });
    }
});

// Pets route
router.get('/pets', isAuthenticated, async (req, res) => {
    try {
        const pets = await Pet.find({ available: true });
        
        res.render('pets', {
            navLinks: navLinksData,
            categoryTitle: 'Available Pets',
            pets: pets,
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
            
        // Get ratings for all products
        const productIds = products.map(product => product._id);
        const productRatings = await Review.aggregate([
            {
                $match: {
                    targetType: 'Product',
                    targetId: { $in: productIds }
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
        
        // Create a map of product ratings for easy lookup
        const ratingsMap = {};
        productRatings.forEach(item => {
            ratingsMap[item._id.toString()] = {
                avgRating: parseFloat(item.avgRating.toFixed(1)) || 0,
                reviewCount: item.reviewCount || 0
            };
        });
        
        // Add ratings to each product
        const productsWithRatings = products.map(product => {
            const productObj = product.toObject();
            const productRating = ratingsMap[product._id.toString()] || { avgRating: 0, reviewCount: 0 };
            productObj.avgRating = productRating.avgRating;
            productObj.reviewCount = productRating.reviewCount;
            return productObj;
        });

        res.render('products', {
            navLinks: navLinksData,
            categoryTitle: categoryTitle,
            products: productsWithRatings,
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
router.get('/products', isAuthenticated, (req, res) => renderProductPage(res, null, 'All Products'));
router.get('/products/petfood', isAuthenticated, (req, res) => renderProductPage(res, 'Pet Food', 'Pet Food'));
router.get('/products/toys', isAuthenticated, (req, res) => renderProductPage(res, 'Toys', 'Pet Toys'));
router.get('/products/accessories', isAuthenticated, (req, res) => renderProductPage(res, 'Accessories', 'Pet Accessories'));

// Services route
router.get('/services', isAuthenticated, async (req, res) => {
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
router.get('/mate', isAuthenticated, async (req, res) => { // Made async for future DB fetch
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
router.get('/about', isAuthenticated, async (req, res) => { // Made async for future DB fetch
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

// Cart page route
router.get('/cart', isAuthenticated, async (req, res) => {
    try {
        // Find user's cart and populate product details
        let cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                refPath: 'items.itemType'
            });

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
        
        // Map products for the view
        const products = cart.items.map(item => {
            // Get common properties for both product types
            let product = {
                id: item.productId._id,
                title: item.productId.name,
                price: item.productId.price,
                quantity: item.quantity,
                itemType: item.itemType
            };
            
            // Handle images based on item type
            if (item.itemType === 'Pet') {
                // Handle pet images
                product.image = item.productId.images && item.productId.images.length > 0 ? 
                    {
                        contentType: item.productId.images[0].contentType,
                        data: item.productId.images[0].data
                    } : null;
                
                // Add pet-specific properties
                product.breed = item.productId.breed;
                product.age = item.productId.age;
                product.gender = item.productId.gender;
                product.category = item.productId.category;
            } else {
                // Handle product images
                product.image = item.productId.images && item.productId.images.length > 0 ? 
                    {
                        contentType: item.productId.images[0].contentType,
                        data: item.productId.images[0].data
                    } : null;
                
                // Add product-specific properties
                product.brand = item.productId.brand;
                product.discount = item.productId.discount || 0;
                product.stock = item.productId.stock;
            }
            
            return product;
        });

        res.render('cart', {
            navLinks: navLinksData,
            pageTitle: 'Shopping Cart',
            cart: cart,
            products: products
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).render('error', { message: 'Error loading cart: ' + err.message });
    }
});

// Cart count route (separate from cart page)
router.get('/cart/count', isAuthenticated, async (req, res) => {
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
router.post('/cart/add', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity, itemType } = req.body;
        
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                error: 'Product ID and quantity are required'
            });
        }

        // Default to Product type if not specified
        const type = itemType || 'Product';
        console.log(`Adding item to cart (user-routes): ${productId}, type: ${type}, quantity: ${quantity}`);

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
                quantity,
                itemType: type
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
            error: 'Server error while adding to cart: ' + err.message
        });
    }
});

// Remove from cart route
router.post('/cart/remove', isAuthenticated, async (req, res) => {
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
router.post('/cart/update', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity, itemType } = req.body;
        
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }
        
        const item = cart.items.find(item => 
            item.productId.toString() === productId
        );
        
        if (item) {
            item.quantity = parseInt(quantity);
            // Update itemType if provided
            if (itemType) {
                item.itemType = itemType;
            }
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
        res.status(500).json({ success: false, error: 'Error updating cart: ' + err.message });
    }
});

// Booking page
router.get('/booking', isAuthenticated, (req, res) => {
    // TODO: Add data needed for booking page if any
    res.render('booking', {
         navLinks: navLinksData, // Add navLinks here too
         // Add any other required data for booking.ejs
    });
});

// Buy page route
router.get('/buy/:id', isAuthenticated, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
  .populate({
    path: 'seller',
    match: { role: 'seller' }, // Only populate seller-type users
    select: 'businessName email phone'
  });
        
        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        if (!product.seller) {
            return res.status(404).render('error', { 
                message: 'Seller information not available for this product' 
            });
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

        // Fetch product reviews
        const reviews = await Review.find({
            targetType: 'Product',
            targetId: product._id
        })
        .populate('user', 'username firstName lastName profileImage')
        .sort({ createdAt: -1 });

        // Calculate average product rating
        let avgProductRating = 0;
        let reviewCount = 0;
        
        if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            avgProductRating = (totalRating / reviews.length).toFixed(1);
            reviewCount = reviews.length;
        }

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
            reviews: reviews,
            productRating: avgProductRating,
            reviewCount: reviewCount,
            isAuthenticated: true
        });
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).render('error', { message: 'Error loading product details' });
    }
});

// Checkout route
router.get('/checkout', isAuthenticated, (req, res) => {
    res.render('checkout', {
        navLinks: navLinksData
    });
});

// Submit review route
router.post('/submit-review', isAuthenticated, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.userId;
        
        if (!productId || !rating) {
            return res.status(400).render('error', { message: 'Product ID and rating are required' });
        }
        
        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }
        
        // Check if user already reviewed this product
        let review = await Review.findOne({
            user: userId,
            targetType: 'Product',
            targetId: productId
        });
        
        if (review) {
            // Update existing review
            review.rating = rating;
            review.comment = comment;
            await review.save();
        } else {
            // Create new review
            review = new Review({
                user: userId,
                rating,
                comment,
                targetType: 'Product',
                targetId: productId
            });
            await review.save();
        }
        
        // Redirect back to the product page
        return res.redirect(`/buy/${productId}`);
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).render('error', { message: 'Error submitting review' });
    }
});

module.exports = router; 