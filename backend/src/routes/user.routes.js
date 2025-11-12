const express = require('express');
const router = express.Router();
const Pet = require('../models/pets');
const Product = require('../models/products');
const Cart = require('../models/cart');
const Review = require('../models/reviews');
const User = require('../models/users');
const Order = require('../models/order');
const Booking = require('../models/Booking');
const PetMate = require('../models/petMate');
const Transaction = require('../models/transaction');
const Wallet = require('../models/wallet');
const Event = require('../models/event');

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

// Get homepage data (featured pets & products)
router.get('/home', isAuthenticated, async (req, res) => {
    try {
        const featuredPets = await Pet.find({ available: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        
        // Get products with ratings
        const products = await Product.find({ isActive: true })
            .limit(5)
            .lean();
        
        const productIds = products.map(p => p._id);
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
        
        const ratingsMap = {};
        productRatings.forEach(item => {
            ratingsMap[item._id.toString()] = {
                avgRating: parseFloat(item.avgRating.toFixed(1)),
                reviewCount: item.reviewCount
            };
        });
        
        const featuredProducts = products
            .map(product => {
                const rating = ratingsMap[product._id.toString()] || { avgRating: 0, reviewCount: 0 };
                return {
                    ...product,
                    avgRating: rating.avgRating,
                    reviewCount: rating.reviewCount
                };
            })
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                slides: [
                    { image: '/images/slide1.jpg', caption: 'Adorable Puppies' },
                    { image: '/images/slide2.jpg', caption: 'Playful Kittens' },
                    { image: '/images/slide3.jpg', caption: 'Exotic Birds' }
                ],
                petCategories: [
                    { name: 'Dogs', image: '/images/dog.jpg', url: '/pets?category=dogs' },
                    { name: 'Cats', image: '/images/cat.jpg', url: '/pets?category=cats' },
                    { name: 'Birds', image: '/images/bird.jpg', url: '/pets?category=birds' },
                    { name: 'Fish', image: '/images/fish.jpg', url: '/pets?category=fish' }
                ],
                featuredPets: featuredPets.map(pet => ({
                    _id: pet._id,
                    name: pet.name,
                    age: pet.age,
                    price: pet.price,
                    breed: pet.breed,
                    category: pet.category,
                    description: pet.description,
                    gender: pet.gender,
                    thumbnail: pet.images && pet.images.length > 0 
                        ? `/images/pet/${pet._id}/0` 
                        : null
                })),
                featuredProducts: featuredProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    discount: product.discount || 0,
                    discountedPrice: product.discount > 0 
                        ? (product.price * (1 - product.discount / 100)).toFixed(2)
                        : product.price.toFixed(2),
                    avgRating: product.avgRating,
                    reviewCount: product.reviewCount,
                    category: product.category,
                    thumbnail: product.images && product.images.length > 0 
                        ? `/images/product/${product._id}/0` 
                        : null
                })),
                features: [
                    { title: 'Quality Pets', description: 'Healthy and well-cared-for pets from trusted breeders', icon: '🐾' },
                    { title: 'Premium Products', description: 'High-quality pet supplies and accessories', icon: '🛒' },
                    { title: 'Expert Services', description: 'Professional pet care and grooming services', icon: '💼' }
                ],
                testimonials: [
                    { text: 'Found my perfect companion here!', author: 'John Wick', rating: 5 },
                    { text: 'Great service and quality products', author: 'Donald Trump', rating: 5 },
                    { text: 'Best place for pet lovers, this is revolutionary', author: 'Tony Stark', rating: 5 },
                    { text: 'Highly recommend! Was in dire need for such a website', author: 'Elon Musk', rating: 5 },
                    { text: 'Amazing experience! Highly recommend!', author: 'Dwayne Johnson', rating: 5 }
                ]
            }
        });
    } catch (err) {
        console.error('Error fetching homepage data:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading homepage',
            message: err.message
        });
    }
});

// Get user dashboard (owner dashboard)
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. This dashboard is for pet owners only.'
            });
        }

        // Fetch orders with better populate handling
        const orders = await Order.find({ customer: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        // Manually populate products to handle deleted products better
        const Product = require('../models/products');
        
        const cleanedOrders = [];
        
        for (const order of orders) {
            if (!order.items || order.items.length === 0) continue;
            
            const populatedItems = [];
            
            for (const item of order.items) {
                try {
                    // Try to fetch the product by ID
                    const product = await Product.findById(item.product)
                        .select('name images price description seller brand category')
                        .lean();
                    
                    if (product) {
                        populatedItems.push({
                            ...item,
                            product: {
                                _id: product._id,
                                name: product.name,
                                images: product.images,
                                price: product.price,
                                image: product.images && product.images.length > 0
                                    ? `/images/product/${product._id}/0`
                                    : null
                            }
                        });
                    } else {
                        // Product not found in database
                        populatedItems.push({
                            ...item,
                            product: {
                                _id: item.product,
                                name: 'Product No Longer Available',
                                image: null
                            }
                        });
                    }
                } catch (error) {
                    // Error fetching product
                    console.error('Error fetching product:', item.product, error.message);
                    populatedItems.push({
                        ...item,
                        product: {
                            _id: item.product,
                            name: 'Product No Longer Available',
                            image: null
                        }
                    });
                }
            }
            
            if (populatedItems.length > 0) {
                cleanedOrders.push({
                    ...order,
                    items: populatedItems
                });
            }
        }

        const validOrders = cleanedOrders.filter(o => 
            !['cancelled', 'pending_payment'].includes(o.status)
        );

        // Get wallet
        const wallet = await Wallet.findOne({ user: req.user._id });
        const walletAmount = wallet ? wallet.balance : 0;

        // Calculate statistics
        const totalOrders = validOrders.length;
        const activeOrders = cleanedOrders.filter(o => 
            ['pending', 'processing'].includes(o.status)
        ).length;
        const totalSpent = validOrders.reduce((sum, order) => 
            sum + (order.totalAmount || 0), 0
        );

        // Get bookings - try both Service model and direct User reference
        console.log('Fetching bookings for user:', req.user._id);
        
        let bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'service',
                select: 'serviceType description rate provider fullName email phoneNo serviceAddress',
                populate: {
                    path: 'provider',
                    select: 'fullName email phoneNo serviceType serviceAddress'
                }
            })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        console.log('Found bookings:', bookings.length);
        
        // If no bookings found with Service model, try direct User reference
        if (bookings.length === 0) {
            console.log('No bookings with Service model, trying direct User reference');
            bookings = await Booking.find({ user: req.user._id })
                .populate('service', 'fullName email phoneNo serviceType serviceAddress')
                .sort({ createdAt: -1 })
                .limit(15)
                .lean();
            console.log('Found bookings with User reference:', bookings.length);
        }

        console.log('Sample booking:', bookings[0]);

        // Filter out bookings with missing service data and limit to 10
        const validBookings = bookings.filter(booking => booking.service).slice(0, 10);
        console.log('Valid bookings after filtering:', validBookings.length);

        const events = await Event.find({ 'attendees.user': req.user._id })
            .sort({ eventDate: 1 })
            .lean();

        // Get wishlist
        const user = await User.findById(req.user._id).lean();
        const [wishlistedPets, wishlistedProducts] = await Promise.all([
            Pet.find({ _id: { $in: user.wishlistPets || [] } }).lean(),
            Product.find({ _id: { $in: user.wishlistProducts || [] } }).lean()
        ]);

        res.json({
            success: true,
            data: {
                user: {
                    _id: req.user._id,
                    username: req.user.username,
                    fullName: req.user.fullName,
                    email: req.user.email,
                    phone: req.user.phoneNo || req.user.phone,
                    address: req.user.address || 'Not provided',
                    profilePicture: req.user.profilePicture 
                        ? `/images/user/${req.user._id}/profile` 
                        : null,
                    joinedDate: req.user.createdAt,
                    lastLogin: new Date()
                },
                statistics: {
                    totalOrders,
                    activeOrders,
                    totalSpent: totalSpent.toFixed(2),
                    walletBalance: walletAmount.toFixed(2),
                    totalBookings: bookings.length,
                    registeredEvents: events.length,
                    wishlistPets: wishlistedPets.length,
                    wishlistProducts: wishlistedProducts.length
                },
                orders: cleanedOrders.map(order => ({
                    _id: order._id,
                    orderNumber: order._id.toString().slice(-8).toUpperCase(),
                    items: order.items.map(item => ({
                        product: {
                            _id: item.product._id,
                            name: item.product.name,
                            image: item.product.images && item.product.images.length > 0
                                ? `/images/product/${item.product._id}/0`
                                : null
                        },
                        quantity: item.quantity,
                        price: item.price
                    })),
                    totalAmount: order.totalAmount,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    createdAt: order.createdAt,
                    orderDate: new Date(order.createdAt).toLocaleDateString('en-IN')
                })),
                bookings: validBookings.map(booking => {
                    // Handle both Service model and direct User reference
                    const isDirectUserRef = booking.service?.fullName && !booking.service?.provider;
                    const serviceType = isDirectUserRef 
                        ? booking.service?.serviceType 
                        : (booking.service?.serviceType || booking.service?.provider?.serviceType);
                    
                    const providerName = isDirectUserRef 
                        ? booking.service?.fullName 
                        : booking.service?.provider?.fullName;
                    
                    const formatServiceType = (type) => {
                        const typeMap = {
                            'veterinarian': 'Veterinary Care',
                            'groomer': 'Pet Grooming',
                            'pet sitter': 'Pet Sitting',
                            'trainer': 'Pet Training', 
                            'breeder': 'Pet Breeding',
                            'walking': 'Dog Walking',
                            'sitting': 'Pet Sitting'
                        };
                        return typeMap[type?.toLowerCase()] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Pet Service');
                    };
                    
                    return {
                        _id: booking._id,
                        service: {
                            _id: booking.service?._id,
                            name: formatServiceType(serviceType),
                            providerName: providerName || 'Service Provider',
                            type: serviceType || 'Unknown Service'
                        },
                        date: booking.date,
                        time: booking.slot || booking.time,
                        status: booking.status || 'pending',
                        createdAt: booking.createdAt,
                        bookingDate: new Date(booking.createdAt).toLocaleDateString('en-IN')
                    };
                }),
                events: events.map(event => ({
                    _id: event._id,
                    title: event.title,
                    date: event.eventDate,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    location: event.location,
                    category: event.category,
                    thumbnail: event.images && event.images.length > 0
                        ? `/images/event/${event._id}/0`
                        : null
                })),
                wishlist: {
                    pets: wishlistedPets.map(pet => ({
                        _id: pet._id,
                        name: pet.name,
                        breed: pet.breed,
                        price: pet.price,
                        age: pet.age,
                        thumbnail: pet.images && pet.images.length > 0
                            ? `/images/pet/${pet._id}/0`
                            : null
                    })),
                    products: wishlistedProducts.map(product => ({
                        _id: product._id,
                        name: product.name,
                        price: product.price,
                        discount: product.discount || 0,
                        thumbnail: product.images && product.images.length > 0
                            ? `/images/product/${product._id}/0`
                            : null
                    }))
                }
            }
        });
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading dashboard',
            message: err.message
        });
    }
});

// Get user statistics
router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. This endpoint is for pet owners only.'
            });
        }

        // Fetch orders
        const orders = await Order.find({ customer: req.user._id }).lean();
        const validOrders = orders.filter(o => 
            !['cancelled', 'pending_payment'].includes(o.status)
        );

        // Get wallet
        const wallet = await Wallet.findOne({ user: req.user._id });
        const walletAmount = wallet ? wallet.balance : 0;

        const totalOrders = validOrders.length;
        const activeOrders = orders.filter(o => 
            ['pending', 'processing'].includes(o.status)
        ).length;
        const totalSpent = validOrders.reduce((sum, order) => 
            sum + (order.totalAmount || 0), 0
        );

        res.json({
            success: true,
            data: {
                totalOrders,
                activeOrders,
                totalSpent,
                walletAmount
            }
        });
    } catch (err) {
        console.error('Error loading stats:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading stats',
            message: err.message
        });
    }
});

// Get wishlist
router.get('/wishlist', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        const [wishlistedPets, wishlistedProducts] = await Promise.all([
            Pet.find({ _id: { $in: user.wishlistPets || [] } }).lean(),
            Product.find({ _id: { $in: user.wishlistProducts || [] } }).lean()
        ]);

        res.json({
            success: true,
            products: wishlistedProducts,
            pets: wishlistedPets
        });
    } catch (err) {
        console.error('Error loading wishlist:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading wishlist',
            message: err.message
        });
    }
});

// Get registered events
router.get('/events/registered', isAuthenticated, async (req, res) => {
    try {
        const events = await Event.find({ 'attendees.user': req.user._id })
            .sort({ eventDate: 1 })
            .lean();

        res.json({
            success: true,
            data: events.map(event => ({
                id: event._id,
                title: event.title,
                date: event.eventDate,
                startTime: event.startTime,
                endTime: event.endTime,
                city: event.location,
                category: event.category
            }))
        });
    } catch (err) {
        console.error('Error loading registered events:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading registered events',
            message: err.message
        });
    }
});

// Get orders
router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name images price description seller'
            })
            .sort({ createdAt: -1 })
            .lean();

        const cleanedOrders = orders
            .map(o => ({
                ...o,
                items: (o.items || []).filter(item => item.product)
            }))
            .filter(o => o.items && o.items.length > 0);

        res.json({
            success: true,
            orders: cleanedOrders
        });
    } catch (err) {
        console.error('Error loading orders:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading orders',
            message: err.message
        });
    }
});

// Get bookings
router.get('/bookings', isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('service', 'fullName serviceType')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: bookings.map(booking => ({
                id: booking._id,
                serviceName: booking.service?.fullName || 'Service Provider',
                serviceType: booking.service?.serviceType || 'Service',
                date: booking.date,
                time: booking.time,
                status: booking.status
            }))
        });
    } catch (err) {
        console.error('Error loading bookings:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading bookings',
            message: err.message
        });
    }
});

// Get cart
router.get('/cart', isAuthenticated, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                refPath: 'items.itemType'
            });

        if (!cart) {
            const newCart = new Cart({
                userId: req.session.userId,
                items: []
            });
            await newCart.save();
            cart = newCart;
        }

        // Filter out invalid items
        cart.items = cart.items.filter(item => item.productId);
        await cart.save();

        const items = cart.items.map(item => {
            const product = item.productId;
            const price = item.itemType === 'Product' && product.discount > 0
                ? product.price * (1 - product.discount / 100)
                : product.price;

            return {
                _id: product._id,
                name: product.name,
                price: price,
                originalPrice: product.price,
                discount: product.discount || 0,
                quantity: item.quantity,
                itemType: item.itemType,
                thumbnail: product.images && product.images.length > 0
                    ? item.itemType === 'Pet'
                        ? `/images/pet/${product._id}/0`
                        : `/images/product/${product._id}/0`
                    : null,
                breed: product.breed,
                brand: product.brand,
                stock: product.stock,
                age: product.age,
                gender: product.gender,
                category: product.category
            };
        });

        const subtotal = items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
        const shipping = subtotal > 500 ? 0 : 50;
        const tax = subtotal * 0.10;
        const total = subtotal + shipping + tax;

        res.json({
            success: true,
            data: {
                items,
                summary: {
                    subtotal: subtotal.toFixed(2),
                    shipping: shipping.toFixed(2),
                    tax: tax.toFixed(2),
                    total: total.toFixed(2),
                    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
                }
            }
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({
            success: false,
            error: 'Error loading cart',
            message: err.message
        });
    }
});

// Get cart count
router.get('/cart/count', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        const cartCount = cart 
            ? cart.items.reduce((total, item) => total + item.quantity, 0) 
            : 0;
        
        res.json({
            success: true,
            data: {
                cartCount
            }
        });
    } catch (err) {
        console.error('Error getting cart count:', err);
        res.status(500).json({
            success: false,
            error: 'Error getting cart count',
            message: err.message
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

        const type = itemType || 'Product';
        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            cart = new Cart({
                userId: req.session.userId,
                items: []
            });
        }

        const existingItem = cart.items.find(item => 
            item.productId.toString() === productId && item.itemType === type
        );

        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            cart.items.push({
                productId,
                quantity: parseInt(quantity),
                itemType: type
            });
        }

        await cart.save();

        const cartCount = cart.items.reduce((total, item) => 
            total + item.quantity, 0
        );

        res.json({
            success: true,
            message: 'Item added to cart',
            data: {
                cartCount
            }
        });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({
            success: false,
            error: 'Error adding to cart',
            message: err.message
        });
    }
});

// Update cart item
router.patch('/cart/update', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity, itemType } = req.body;
        
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                error: 'Product ID and quantity are required'
            });
        }

        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }
        
        const item = cart.items.find(item => 
            item.productId.toString() === productId
        );
        
        if (item) {
            item.quantity = parseInt(quantity);
            if (itemType) {
                item.itemType = itemType;
            }
            await cart.save();

            const cartCount = cart.items.reduce((sum, item) => 
                sum + item.quantity, 0
            );
            
            res.json({
                success: true,
                message: 'Cart updated',
                data: {
                    cartCount
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({
            success: false,
            error: 'Error updating cart',
            message: err.message
        });
    }
});

// Remove from cart
router.delete('/cart/remove/:productId', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.params;
        
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }
        
        cart.items = cart.items.filter(item => 
            item.productId.toString() !== productId
        );
        
        await cart.save();

        const cartCount = cart.items.reduce((sum, item) => 
            sum + item.quantity, 0
        );
        
        res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                cartCount
            }
        });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({
            success: false,
            error: 'Error removing from cart',
            message: err.message
        });
    }
});

// Prepare checkout (validates cart and returns shipping info)
router.post('/checkout/prepare', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                refPath: 'items.itemType'
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Validate items
        cart.items = cart.items.filter(item => item.productId);
        
        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid items in cart'
            });
        }

        const subtotal = cart.items.reduce((sum, item) => {
            const price = parseFloat(item.productId?.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);

        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.10;
        const total = subtotal + shipping + tax;

        res.json({
            success: true,
            data: {
                items: cart.items.map(item => ({
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    quantity: item.quantity,
                    itemType: item.itemType,
                    thumbnail: item.productId.images && item.productId.images.length > 0
                        ? item.itemType === 'Pet'
                            ? `/images/pet/${item.productId._id}/0`
                            : `/images/product/${item.productId._id}/0`
                        : null
                })),
                summary: {
                    subtotal: subtotal.toFixed(2),
                    shipping: shipping.toFixed(2),
                    tax: tax.toFixed(2),
                    total: total.toFixed(2)
                },
                userInfo: {
                    fullName: req.user.fullName || '',
                    address: req.user.address || '',
                    phone: req.user.phoneNo || req.user.phone || ''
                }
            }
        });
    } catch (err) {
        console.error('Error preparing checkout:', err);
        res.status(500).json({
            success: false,
            error: 'Error preparing checkout',
            message: err.message
        });
    }
});

// Submit checkout (create order with shipping info)
router.post('/checkout/submit', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                refPath: 'items.itemType'
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        const { fullName, address, city, state, zipCode, phone } = req.body;

        // Validation
        if (!fullName?.trim() || !address?.trim() || !city?.trim() || 
            !state?.trim() || !zipCode?.trim() || !phone?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'All shipping fields are required'
            });
        }

        // Validate phone and zip
        if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number'
            });
        }

        if (!/^\d{6}$/.test(zipCode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid zip code'
            });
        }

        const subtotal = cart.items.reduce((sum, item) => {
            const price = parseFloat(item.productId?.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + price * quantity;
        }, 0);

        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.10;
        const total = subtotal + shipping + tax;

        // Store pending order in session
        req.session.pendingOrder = {
            items: cart.items.map(item => ({
                product: item.productId._id,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.productId.price),
                seller: item.productId.seller
            })),
            totalAmount: total,
            seller: cart.items[0]?.productId.seller || null
        };

        req.session.shippingInfo = {
            fullName: fullName.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            phone: phone.trim()
        };

        res.json({
            success: true,
            message: 'Checkout information saved',
            data: {
                totalAmount: total.toFixed(2),
                redirectUrl: '/payment'
            }
        });

    } catch (err) {
        console.error('Error processing checkout:', err);
        res.status(500).json({
            success: false,
            error: 'Error processing checkout',
            message: err.message
        });
    }
});

// Get payment page data
router.get('/payment/info', isAuthenticated, async (req, res) => {
    try {
        if (!req.session.pendingOrder || !req.session.shippingInfo) {
            return res.status(400).json({
                success: false,
                error: 'No pending order found',
                redirectUrl: '/cart'
            });
        }

        // Get wallet
        let wallet = await Wallet.findOne({ user: req.session.userId });
        if (!wallet) {
            wallet = new Wallet({
                user: req.session.userId,
                balance: 10000
            });
            await wallet.save();
        }

        // Get cart for display
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate('items.productId')
            .lean();

        let cartData = {
            items: [],
            summary: {}
        };

        if (cart && cart.items.length > 0) {
            let subtotal = 0;
            cart.items.forEach(item => {
                const product = item.productId;
                if (!product) return;

                const price = product.discount > 0
                    ? product.price * (1 - product.discount / 100)
                    : product.price;

                subtotal += price * item.quantity;

                cartData.items.push({
                    _id: product._id,
                    name: product.name,
                    price: price,
                    quantity: item.quantity,
                    itemType: item.itemType,
                    thumbnail: product.images && product.images.length > 0
                        ? item.itemType === 'Pet'
                            ? `/images/pet/${product._id}/0`
                            : `/images/product/${product._id}/0`
                        : null
                });
            });

            const shipping = subtotal >= 500 ? 0 : 50;
            const tax = subtotal * 0.10;
            const total = subtotal + shipping + tax;

            cartData.summary = {
                subtotal: subtotal.toFixed(2),
                shipping: shipping.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2)
            };
        }

        res.json({
            success: true,
            data: {
                order: {
                    totalAmount: req.session.pendingOrder.totalAmount.toFixed(2)
                },
                wallet: {
                    balance: wallet.balance.toFixed(2)
                },
                cart: cartData,
                shippingInfo: req.session.shippingInfo
            }
        });
    } catch (error) {
        console.error('Error loading payment info:', error);
        res.status(500).json({
            success: false,
            error: 'Error loading payment information',
            message: error.message
        });
    }
});

// Process payment
router.post('/payment/process', isAuthenticated, async (req, res) => {
    try {
        if (!req.session.pendingOrder || !req.session.shippingInfo) {
            return res.status(400).json({
                success: false,
                error: 'No pending order found'
            });
        }

        const { paymentMethod, paymentDetails } = req.body;
        const { items } = req.session.pendingOrder;
        const shippingInfo = req.session.shippingInfo;

        // Calculate amounts
        let subtotal = items.reduce((sum, item) => 
            sum + item.price * item.quantity, 0
        );
        let shipping = subtotal >= 500 ? 0 : 50;
        let totalAmount = subtotal + shipping;

        // Process payment based on method
        if (paymentMethod === 'wallet') {
            const userWallet = await Wallet.findOne({ user: req.session.userId });
            if (!userWallet) {
                return res.status(400).json({
                    success: false,
                    error: 'Wallet not found'
                });
            }

            if (userWallet.balance < totalAmount) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient wallet balance'
                });
            }

            await userWallet.deductFunds(totalAmount);

            // Distribute funds
            const adminWallet = await Wallet.findOne({ 
                user: "68e927a3cdb7fb04ad6b53bb" 
            });
            
            if (adminWallet) {
                const adminShare = subtotal >= 500 
                    ? subtotal * 0.10 
                    : subtotal * 0.10 + shipping;
                await adminWallet.addFunds(adminShare);

                await Transaction.create({
                    from: req.session.userId,
                    to: adminWallet.user,
                    amount: adminShare,
                    type: 'commission',
                    description: 'Order commission'
                });
            }

            // Pay sellers
            for (const item of items) {
                const sellerWallet = await Wallet.findOne({ user: item.seller });
                if (!sellerWallet) continue;

                const sellerShare = item.price * item.quantity * 0.90;
                await sellerWallet.addFunds(sellerShare);

                await Transaction.create({
                    from: req.session.userId,
                    to: sellerWallet.user,
                    amount: sellerShare,
                    type: 'order_payment',
                    description: `Payment for order`
                });
            }

        } else if (paymentMethod === 'upi') {
            const upiId = paymentDetails?.upiId?.trim();
            if (!/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(upiId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid UPI ID'
                });
            }
        } else if (paymentMethod === 'card' || paymentMethod === 'credit-card') {
            const { cardName, cardNumber, expiryDate, cvv } = paymentDetails || {};
            
            if (!cardName?.trim() || 
                !/^\d{13,19}$/.test(cardNumber?.replace(/\s+/g, '')) ||
                !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiryDate?.trim()) ||
                !/^\d{3,4}$/.test(cvv?.trim())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid card details'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method'
            });
        }

        // Create order
        const order = new Order({
            customer: req.session.userId,
            seller: items[0]?.seller || null,
            items: items,
            totalAmount: totalAmount,
            status: 'pending',
            paymentStatus: 'paid',
            paymentMethod: paymentMethod,
            shippingAddress: shippingInfo
        });
        await order.save();

        // Clear cart
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        // Clear session
        delete req.session.pendingOrder;
        delete req.session.shippingInfo;

        res.json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                orderId: order._id,
                redirectUrl: `/order-confirmation/${order._id}`
            }
        });

    } catch (error) {
        console.error('Payment processing failed:', error);
        res.status(500).json({
            success: false,
            error: 'Payment processing failed',
            message: error.message
        });
    }
});

// Get order confirmation
router.get('/order-confirmation/:orderId', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.product')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: {
                order: {
                    _id: order._id,
                    orderNumber: order._id.toString().slice(-8).toUpperCase(),
                    totalAmount: order.totalAmount,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    createdAt: order.createdAt,
                    shippingAddress: order.shippingAddress,
                    items: order.items.map(item => ({
                        product: {
                            _id: item.product._id,
                            name: item.product.name,
                            thumbnail: item.product.images && item.product.images.length > 0
                                ? `/images/product/${item.product._id}/0`
                                : null
                        },
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });
    } catch (error) {
        console.error('Error loading order confirmation:', error);
        res.status(500).json({
            success: false,
            error: 'Error loading order confirmation',
            message: error.message
        });
    }
});

// Get all user orders
router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = { customer: req.session.userId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const formattedOrders = orders
            .filter(order => order.items.every(item => item.product !== null))
            .map(order => ({
                _id: order._id,
                orderNumber: order._id.toString().slice(-8).toUpperCase(),
                items: order.items.map(item => ({
                    product: {
                        _id: item.product._id,
                        name: item.product.name,
                        thumbnail: item.product.images && item.product.images.length > 0
                            ? `/images/product/${item.product._id}/0`
                            : null
                    },
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: order.totalAmount,
                status: order.status,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt,
                orderDate: new Date(order.createdAt).toLocaleDateString('en-IN')
            }));

        res.json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching orders',
            message: error.message
        });
    }
});

// Get single order details
router.get('/orders/:orderId', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            customer: req.session.userId
        })
        .populate('items.product')
        .populate('seller', 'fullName businessName email phoneNo')
        .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: {
                order: {
                    _id: order._id,
                    orderNumber: order._id.toString().slice(-8).toUpperCase(),
                    items: order.items.map(item => ({
                        product: {
                            _id: item.product._id,
                            name: item.product.name,
                            description: item.product.description,
                            images: item.product.images?.map((_, index) => 
                                `/images/product/${item.product._id}/${index}`
                            ) || []
                        },
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: (item.quantity * item.price).toFixed(2)
                    })),
                    totalAmount: order.totalAmount,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    shippingAddress: order.shippingAddress,
                    seller: order.seller ? {
                        _id: order.seller._id,
                        name: order.seller.businessName || order.seller.fullName,
                        email: order.seller.email,
                        phone: order.seller.phoneNo
                    } : null,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                    orderDate: new Date(order.createdAt).toLocaleDateString('en-IN')
                }
            }
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching order details',
            message: error.message
        });
    }
});

// Wishlist operations
router.post('/wishlist/:type/:id', isAuthenticated, async (req, res) => {
    try {
        const { type, id } = req.params;
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        let wishlisted;
        if (type === 'product') {
            const index = user.wishlistProducts.findIndex(
                pid => pid.toString() === id
            );
            if (index === -1) {
                user.wishlistProducts.push(id);
                wishlisted = true;
            } else {
                user.wishlistProducts.splice(index, 1);
                wishlisted = false;
            }
        } else if (type === 'pet') {
            const index = user.wishlistPets.findIndex(
                pid => pid.toString() === id
            );
            if (index === -1) {
                user.wishlistPets.push(id);
                wishlisted = true;
            } else {
                user.wishlistPets.splice(index, 1);
                wishlisted = false;
            }
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid wishlist type'
            });
        }

        await user.save();

        res.json({
            success: true,
            message: wishlisted 
                ? `${type} added to wishlist` 
                : `${type} removed from wishlist`,
            data: {
                wishlisted
            }
        });
    } catch (err) {
        console.error('Error toggling wishlist:', err);
        res.status(500).json({
            success: false,
            error: 'Error updating wishlist',
            message: err.message
        });
    }
});

// Get wishlist
router.get('/wishlist', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const [wishlistedPets, wishlistedProducts] = await Promise.all([
            Pet.find({ _id: { $in: user.wishlistPets || [] } }).lean(),
            Product.find({ _id: { $in: user.wishlistProducts || [] } }).lean()
        ]);

        res.json({
            success: true,
            data: {
                pets: wishlistedPets.map(pet => ({
                    _id: pet._id,
                    name: pet.name,
                    breed: pet.breed,
                    price: pet.price,
                    age: pet.age,
                    gender: pet.gender,
                    thumbnail: pet.images && pet.images.length > 0
                        ? `/images/pet/${pet._id}/0`
                        : null
                })),
                products: wishlistedProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    discount: product.discount || 0,
                    discountedPrice: product.discount > 0
                        ? (product.price * (1 - product.discount / 100)).toFixed(2)
                        : product.price.toFixed(2),
                    thumbnail: product.images && product.images.length > 0
                        ? `/images/product/${product._id}/0`
                        : null
                }))
            }
        });
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching wishlist',
            message: err.message
        });
    }
});

module.exports = router;