const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

const Pet = require('../models/pets');
const Product = require('../models/products');
const Service = require('../models/serviceProvider');
const Cart = require('../models/cart');
const Review = require('../models/reviews');
const User = require('../models/users');
const Order = require('../models/order');
const Booking = require('../models/Booking');
const PetMate = require('../models/petMate');
const Wallet = require('../models/wallet');


const navLinksData = [
    { name: 'Home', url: '/home' },
    { name: 'Pets', url: '/pets' },
    { name: 'Products', url: '/products'},
    { 
        name: 'Services', 
        url: '#', 
        dropdown: true,
        dropdownItems: [
            { name: 'Pet Care', url: '/services' },
            { name: 'Pet Mate', url: '/mate' },
            { name: 'Events', url: "/events"}
        ]
    },
    { name: 'About', url: '/about' }
];

// Home page
router.get('/home', isAuthenticated, async (req, res) => {
    try {
        const featuredPets = await Pet.find()
        .sort({createdAt: 1})
        .limit(5)
        
        const featuredProducts = await Product.find()
        .sort({avgRating: -1})
        .limit(5)

        res.render('homepage', {
            navLinks: navLinksData,
            slides: [
                { image: '/images/slide1.jpg', caption: 'Adorable Puppies' },
                { image: '/images/slide2.jpg', caption: 'Playful Kittens' },
                { image: '/images/slide3.jpg', caption: 'Exotic Birds' }
            ],
            petCategories: [
                { name: 'Dogs', image: '/images/dog.jpg' },
                { name: 'Cats', image: '/images/cat.jpg' },
                { name: 'Birds', image: '/images/bird.jpg' },
                { name: 'Fish', image: '/images/fish.jpg' }
            ],
            featuredPets: featuredPets.map(pet => ({
                _id: pet._id,
                name: pet.name,
                age: pet.age,
                price: pet.price,
                breed: pet.breed,
                images: pet.images,
                category: pet.category,
                description: pet.description
            })),
            featuredProducts: featuredProducts.map(product => ({
                _id: product._id,
                name: product.name,
                price: product.price,
                images: product.images,
                avgRating: product.avgRating,
                reviewCount: product.reviewCount,
                discount: product.discount,
                category: product.category
            })),
            features: [
                { title: 'Quality Pets', description: 'Healthy and well-cared-for pets from trusted breeders' },
                { title: 'Premium Products', description: 'High-quality pet supplies and accessories' },
                { title: 'Expert Services', description: 'Professional pet care and grooming services' }
            ],
            testimonials: [
                { text: 'Found my perfect companion here!', author: 'John Wick' },
                { text: 'Great service and quality products', author: 'Donald Trump' },
                { text: 'Best place for pet lovers, this is revolutionary', author: 'Tony stark' },
                { text: 'Highly recommend! Was in dire need for such a website', author: 'Elon Musk' },
                {text: 'Amazing experience! Highly recommend!', author: 'Dwayne Johnson' },
            ],
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

        // Fetch orders where this user is the customer
        const orders = await Order.find({ customer: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name breed images price description seller',
                model: 'Product'
            })
            .sort({ createdAt: -1 })
            .lean();

        // Remove any items that failed to populate (no product)
        const cleanedOrders = orders
            .map(o => ({
                ...o,
                items: (o.items || []).filter(item => item.product)
            }))
            // Optionally drop orders that end up with zero items
            .filter(o => (o.items && o.items.length > 0));

        // Normalize fields expected by the EJS table
        const ordersForView = cleanedOrders.map(o => ({
            ...o,
            id: (o.orderNumber || o._id || '').toString(),
            orderDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''
        }));

        // Calculate stats
        const validOrders = ordersForView.filter(o => !['cancelled', 'pending_payment'].includes(o.status));
        const totalOrders = validOrders.length;
        const activeOrders = ordersForView.filter(o => ['pending', 'processing'].includes(o.status)).length;

        // Get actual wallet balance
        const wallet = await Wallet.findOne({ user: req.user._id });
        const walletAmount = wallet ? wallet.balance : 0;  

        // Calculate total spent based on initial balance (10000) minus remaining balance
        const totalSpent = 10000 - walletAmount;  // This is the key change

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
            totalOrders,
            activeOrders,
            totalSpent,  // Now correctly shows amount spent from initial 10000
            walletAmount // Shows remaining balance
        };

        // Add this before the render statement in owner-dashboard route
        const bookings = await Booking.find({ customer: req.user._id })
            .populate('service')
            .sort({ createdAt: -1 })
            .lean();

        const formattedBookings = bookings.map(booking => ({
            ...booking,
            bookingDate: new Date(booking.createdAt).toLocaleDateString('en-IN'),
            serviceDate: new Date(booking.serviceDate).toLocaleDateString('en-IN')
        }));

        res.render('owner-dashboard', {
            user: userData,
            orders: ordersForView.filter(o => !['cancelled', 'pending_payment'].includes(o.status)), // Only show valid orders
            bookings: formattedBookings,
            navLinks: navLinksData,
            wishlistedPets: [],
            wishlistedProducts: []
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

// Products route
router.get('/products', isAuthenticated, (req, res) => renderProductPage(res, null, 'All Products'));
router.get('/products/petfood', isAuthenticated, (req, res) => renderProductPage(res, 'Pet Food', 'Pet Food'));
router.get('/products/toys', isAuthenticated, (req, res) => renderProductPage(res, 'Toys', 'Pet Toys'));
router.get('/products/accessories', isAuthenticated, (req, res) => renderProductPage(res, 'Accessories', 'Pet Accessories'));


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
            categoryFilters: [
                { id: 'petfood', value: 'Pet Food', label: 'Pet Food' },
                { id: 'toys', value: 'Toys', label: 'Toys' },
                { id: 'accessories', value: 'Accessories', label: 'Accessories' }
            ],

            brandFilters: [], 
            ratingFilters: [], 
            dynamicFilters: [] 
        });

    } catch (err) {
        console.error(`Error fetching ${categoryTitle}:`, err);
        res.status(500).render('error', { message: `Error fetching ${categoryTitle}` });
    }
}

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
const ITEMS_PER_PAGE = 10; // Number of items per page

router.get('/mate', isAuthenticated, async (req, res) => {
    try {
        const { petType, breed, state, district, gender, age, page = 1 } = req.query;
        const currentPage = parseInt(page);
        
        // Build filter object
        const filter = {};
        
        // Handle array filters for checkboxes
        if (petType) filter.petType = Array.isArray(petType) ? { $in: petType } : petType;
        if (breed) filter.breed = Array.isArray(breed) ? { $in: breed } : breed;
        if (state) filter['location.state'] = state;
        if (district) filter['location.district'] = new RegExp(district, 'i');
        if (gender) filter.gender = Array.isArray(gender) ? { $in: gender } : gender;
        
        // Handle age filters
        if (age) {
            const ageConditions = [];
            const ageFilters = Array.isArray(age) ? age : [age];

            ageFilters.forEach(ageFilter => {
                switch(ageFilter) {
                    case 'puppy':
                        ageConditions.push({ 
                            $or: [
                                { 'age.value': { $lt: 1 }, 'age.unit': 'years' },
                                { 'age.value': { $lt: 12 }, 'age.unit': 'months' }
                            ]
                        });
                        break;
                    case 'young':
                        ageConditions.push({ 
                            $or: [
                                { 'age.value': { $gte: 1, $lte: 3 }, 'age.unit': 'years' },
                                { 'age.value': { $gte: 12, $lte: 36 }, 'age.unit': 'months' }
                            ]
                        });
                        break;
                    // Add other age cases similarly
                }
            });

            if (ageConditions.length > 0) {
                filter.$and = ageConditions;
            }
        }

        // Get total count for pagination
        const totalPets = await PetMate.countDocuments(filter);
        const totalPages = Math.ceil(totalPets / ITEMS_PER_PAGE);

        // Fetch paginated pets
        const matingPets = await PetMate.find(filter)
            .populate('listedBy')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
            .exec();

        // Get unique values for filters
        const [rawPetTypes, rawBreeds, rawStates] = await Promise.all([
            PetMate.distinct('petType'),
            PetMate.distinct('breed'),
            PetMate.distinct('location.state')
        ]);

        // Formatting function
        const formatLabel = (str) => 
            str.replace(/-/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase());

        res.render('mate', {
            navLinks: navLinksData,
            petTypes: rawPetTypes.map(value => ({ value, label: formatLabel(value) })),
            breeds: rawBreeds.map(value => ({ value, label: formatLabel(value) })),
            states: rawStates.map(value => ({ value, label: formatLabel(value) })),
            pets: matingPets,
            selectedFilters: req.query,
            currentPage,
            totalPages,
            pageSize: ITEMS_PER_PAGE
        });
    } catch (err) {
        console.error('Error fetching mate data:', err);
        res.status(500).render('error', { message: 'Error loading PetMate page' });
    }
});
// About route
router.get('/about', isAuthenticated, async (req, res) => { // Made async for future DB fetch
    try {
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

// Checkout route
router.get('/checkout', isAuthenticated, async (req, res) => {
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
            cart = newCart;
        }

        // Calculate totals with proper validation
        const subtotal = cart.items.reduce((sum, item) => {
            const price = parseFloat(item.productId?.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
        const shipping = subtotal > 500 ? 0 : 50; // Free shipping over ₹500
        const tax = subtotal * 0.10; // 10% GST
        const total = subtotal + shipping + tax;

        // Add calculated values to cart object
        cart.subtotal = subtotal;
        cart.shipping = shipping;
        cart.tax = tax;
        cart.total = total;

        // Ensure cart items have proper structure for the view
        cart.items = cart.items.map(item => {
            const itemObj = item.toObject();
            return {
                ...itemObj,
                price: parseFloat(itemObj.productId?.price) || 0,
                quantity: parseInt(itemObj.quantity) || 1,
                title: itemObj.productId?.name || 'Unknown Product',
                image_url: itemObj.productId?.images?.[0]?.url || '/images/default-product.jpg',
                // Add image data for base64 conversion if needed
                image_data: itemObj.productId?.images?.[0]?.data,
                image_contentType: itemObj.productId?.images?.[0]?.contentType
            };
        });

        res.render('checkout', {
            navLinks: navLinksData,
            cart: cart
        });
    } catch (err) {
        console.error('Error loading checkout:', err);
        res.status(500).render('error', { message: 'Error loading checkout page' });
    }
});

// POST checkout route - handle form submission
router.post('/checkout', isAuthenticated, async (req, res) => {
    try {
        // Get user's cart
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                refPath: 'items.itemType'
            });

        if (!cart || cart.items.length === 0) {
            return res.render('checkout', {
                navLinks: navLinksData,
                cart: { items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 },
                error: 'Your cart is empty. Please add items before checkout.'
            });
        }

        // Extract form data
        const {
            fullName,
            address,
            city,
            state,
            zipCode,
            phone,
            subtotal,
            shipping,
            tax,
            total
        } = req.body;

        // Validate required fields
        const errors = [];
        if (!fullName || !fullName.trim()) errors.push('Full name is required');
        if (!address || !address.trim()) errors.push('Address is required');
        if (!city || !city.trim()) errors.push('City is required');
        if (!state || !state.trim()) errors.push('State is required');
        if (!zipCode || !zipCode.trim()) errors.push('Zip code is required');
        if (!phone || !phone.trim()) errors.push('Phone number is required');

        // Validate phone number format
        if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
            errors.push('Please enter a valid 10-digit phone number');
        }

        // Validate zip code format
        if (zipCode && !/^\d{6}$/.test(zipCode)) {
            errors.push('Please enter a valid 6-digit zip code');
        }

        if (errors.length > 0) {
            return res.render('checkout', {
                navLinks: navLinksData,
                cart: cart,
                error: errors.join(', ')
            });
        }

        // Calculate totals from server-side data
        const calculatedSubtotal = cart.items.reduce((sum, item) => {
            const price = parseFloat(item.productId?.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
        const calculatedShipping = calculatedSubtotal > 500 ? 0 : 50;
        const calculatedTax = calculatedSubtotal * 0.18;
        const calculatedTotal = calculatedSubtotal + calculatedShipping + calculatedTax;


        // Verify totals match (basic security check)
        if (Math.abs(calculatedTotal - parseFloat(total)) > 0.01) {
            return res.render('checkout', {
                navLinks: navLinksData,
                cart: cart,
                error: 'Order total mismatch. Please refresh and try again.'
            });
        }

        // Get user info for email
        const user = await User.findById(req.session.userId);

        // Create order with proper data validation
        const orderItems = cart.items.map(item => {
            const price = parseFloat(item.productId?.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            
            if (!item.productId || !item.productId._id) {
                throw new Error('Invalid product in cart');
            }
            
            return {
                product: item.productId._id,
                quantity: quantity,
                price: price
            };
        });

        // Store shipping information in session for payment processing
        req.session.shippingInfo = {
            fullName: fullName.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            phone: phone.trim()
        };

        // Store cart data in session for payment processing
        req.session.pendingOrder = {
            items: orderItems,
            totalAmount: calculatedTotal,
            seller: cart.items[0].productId.seller
        };

        // Redirect to payment page - order will be created only after successful payment
        res.redirect('/payment');
    } catch (err) {
        console.error('Error processing checkout:', err);
        res.render('checkout', {
            navLinks: navLinksData,
            cart: { items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 },
            error: 'Error processing your order. Please try again.'
        });
    }
});

// Payment page route
router.get('/payment', isAuthenticated, async (req, res) => {
    try {
        // Check if we have pending order data in session
        if (!req.session.pendingOrder || !req.session.shippingInfo) {
            return res.redirect('/cart');
        }
        
        // Check if user already has a recent completed order (within last 5 minutes)
        const recentOrder = await Order.findOne({
            customer: req.session.userId,
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
        });
        
        if (recentOrder) {
            // Clear session data and redirect to order confirmation
            delete req.session.pendingOrder;
            delete req.session.shippingInfo;
            return res.redirect('/order-confirmation');
        }

        // Get user's wallet balance
        let wallet = await Wallet.findOne({ user: req.session.userId });
        if (!wallet) {
            // Create wallet if it doesn't exist
            wallet = new Wallet({
                user: req.session.userId,
                balance: 10000 // Initial balance
            });
            await wallet.save();
        }

        // Get cart data for order summary
        const Cart = require('../models/cart');
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate('items.productId')
            .lean();

        let cartData = {
            items: [],
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0
        };

        if (cart && cart.items.length > 0) {
            let subtotal = 0;
            cart.items.forEach(item => {
                const product = item.productId;
                if (!product) return;

                const price = product.discount > 0
                    ? product.price * (1 - product.discount / 100)
                    : product.price;

                const itemTotal = price * item.quantity;
                subtotal += itemTotal;

                cartData.items.push({
                    _id: product._id,
                    name: product.name,
                    price: price,
                    quantity: item.quantity,
                    image_url: product.image_url || '/images/default-product.jpg',
                    itemType: item.itemType
                });
            });

            const shipping = subtotal >= 500 ? 0 : 50;
            const tax = subtotal * 0.18; // 18% GST
            const total = subtotal + shipping + tax;

            cartData.subtotal = subtotal;
            cartData.shipping = shipping;
            cartData.tax = tax;
            cartData.total = total;
        }

        res.render('payment', {
            navLinks: navLinksData,
            order: {
                totalAmount: req.session.pendingOrder.totalAmount,
                items: req.session.pendingOrder.items
            },
            user: req.user,
            wallet: wallet,
            cart: cartData
        });
    } catch (error) {
        console.error('Error loading payment page:', error);
        res.status(500).render('error', { message: 'Error loading payment page' });
    }
});

// Process payment route - create order only after successful payment
router.post('/payment', isAuthenticated, async (req, res) => {
    try {
        // Check if we have pending order data in session
        if (!req.session.pendingOrder || !req.session.shippingInfo) {
            return res.status(400).json({ 
                success: false, 
                message: 'No pending order found. Please complete checkout first.' 
            });
        }

        const { paymentMethod } = req.body;
        const { items, totalAmount, seller } = req.session.pendingOrder;
        const shippingInfo = req.session.shippingInfo;

        // Process payment
        if (paymentMethod === 'wallet') {
            // Deduct from wallet
            const wallet = await Wallet.findOne({ user: req.session.userId });
            if (!wallet) {
                return res.status(400).json({ success: false, message: 'Wallet not found' });
            }
            
            try {
                await wallet.deductFunds(totalAmount);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
            }
        }

        // Create order only after successful payment
        console.log('Creating order with items:', items);
        const order = new Order({
            customer: req.session.userId,
            seller: seller,
            items: items,
            totalAmount: totalAmount,
            status: 'confirmed', // Order is confirmed after successful payment
            paymentStatus: 'paid',
            paymentMethod: paymentMethod || 'wallet',
            shippingAddress: shippingInfo
        });

        await order.save();
        console.log('Order created with ID:', order._id);

        // Clear the cart after successful order creation
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        // Clear session data
        delete req.session.pendingOrder;
        delete req.session.shippingInfo;

        // Redirect to order confirmation
        res.json({ 
            success: true, 
            message: 'Payment successful!',
            redirectUrl: `/order-details/${order._id}`
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, message: 'Payment processing failed' });
    }
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

// Toggle wishlist for Product (user-specific)
router.post('/wishlist/product/:id', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const prodId = req.params.id;
        const index = user.wishlistProducts.findIndex(id => id.toString() === prodId);
        let wishlisted;
        if (index === -1) {
            user.wishlistProducts.push(prodId);
            wishlisted = true;
        } else {
            user.wishlistProducts.splice(index, 1);
            wishlisted = false;
        }
        await user.save();
        res.json({ success: true, wishlisted });
    } catch (err) {
        console.error('Error toggling product wishlist:', err);
        res.status(500).json({ success: false, message: 'Failed to toggle wishlist' });
    }
});

// Toggle wishlist for Pet (user-specific)
router.post('/wishlist/pet/:id', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const petId = req.params.id;
        const index = user.wishlistPets.findIndex(id => id.toString() === petId);
        let wishlisted;
        if (index === -1) {
            user.wishlistPets.push(petId);
            wishlisted = true;
        } else {
            user.wishlistPets.splice(index, 1);
            wishlisted = false;
        }
        await user.save();
        res.json({ success: true, wishlisted });
    } catch (err) {
        console.error('Error toggling pet wishlist:', err);
        res.status(500).json({ success: false, message: 'Failed to toggle wishlist' });
    }
});

// Get current user's wishlist (pets and products)
router.get('/wishlist', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const [wishlistedPets, wishlistedProducts] = await Promise.all([
            Pet.find({ _id: { $in: user.wishlistPets || [] } }).lean(),
            Product.find({ _id: { $in: user.wishlistProducts || [] } }).lean()
        ]);

        res.json({ success: true, wishlistedPets, wishlistedProducts });
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
});

// Get user orders (used by dashboard AJAX)
router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.session.userId })
            .populate('items.product')
            .populate('seller')
            .sort({ createdAt: -1 })
            .lean();

        const filteredOrders = orders.filter(order => {
            if (order.status === 'cancelled') return true;
            return order.items.every(item => item.product !== null);
        });

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                let image_url = '/images/default-product.jpg';
                if (item.product && item.product.images && item.product.images.length > 0) {
                    const img = item.product.images[0];
                    if (img.url) {
                        image_url = img.url;
                    } else if (img.data && img.contentType) {
                        let base64;
                        if (typeof img.data === 'string') {
                            base64 = img.data;
                        } else if (img.data?.buffer) {
                            base64 = Buffer.from(img.data.buffer).toString('base64');
                        } else if (Buffer.isBuffer(img.data)) {
                            base64 = img.data.toString('base64');
                        }
                        image_url = `data:${img.contentType};base64,${base64}`;
                    }
                }
                if (item.product) {
                    item.product.image_url = image_url;
                }
            });
        });

        res.json({ success: true, orders: filteredOrders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// Render single order details page
router.get('/order-details/:orderId', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            customer: req.session.userId
        })
        .populate('items.product')
        .populate('seller')
        .lean();

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        order.items.forEach(item => {
            let image_url = '/images/default-product.jpg';
            if (item.product && item.product.images && item.product.images.length > 0) {
                const img = item.product.images[0];
                if (img.url) {
                    image_url = img.url;
                } else if (img.data && img.contentType) {
                    let base64;
                    if (typeof img.data === 'string') {
                        base64 = img.data;
                    } else if (img.data?.buffer) {
                        base64 = Buffer.from(img.data.buffer).toString('base64');
                    } else if (Buffer.isBuffer(img.data)) {
                        base64 = img.data.toString('base64');
                    }
                    image_url = `data:${img.contentType};base64,${base64}`;
                }
            }
            if (item.product) {
                item.product.image_url = image_url;
            }
        });

        res.render('order-details', { order, navLinks: navLinksData, user: req.user, siteName: 'PetVerse' });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { message: 'Failed to fetch order details' });
    }
});

// Order confirmation route
router.get('/order-confirmation', isAuthenticated, async (req, res) => {
    try {
        // Get the most recent order for the user
        const order = await Order.findOne({ customer: req.session.userId })
            .sort({ createdAt: -1 })
            .populate('items.product')
            .lean();

        if (!order) {
            return res.redirect('/');
        }

        res.render('order-confirmation', {
            navLinks: navLinksData,
            order: order,
            orderId: order._id,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading order confirmation:', error);
        res.redirect('/');
    }
});

module.exports = router;