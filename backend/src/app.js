const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();

const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000', 
        'http://localhost:3001',
        'http://localhost:5173'
    ],
    credentials: true, // Allow cookies/session
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false, 
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax'
    },
    name: 'petverse.sid' 
}));

app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const User = require('./models/users');
            req.user = await User.findById(req.session.userId);
            
            if (!req.user) {
                req.session.userId = null;
                req.session.userRole = null;
            }
        } catch (err) {
            console.error('User loading error:', err);
            req.session.userId = null;
            req.session.userRole = null;
        }
    }
    next();
});

mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection failed:', err));

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// API Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const imageRoutes = require('./routes/image.routes');
const productRoutes = require('./routes/product.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const serviceProviderRoutes = require('./routes/serviceprovider.routes');
const userRoutes = require('./routes/user.routes');
const cartRoutes = require('./routes/cart.routes');
const petRoutes = require('./routes/pet.routes');
const mateRoutes = require('./routes/mate.routes');
const sellerRoutes = require('./routes/seller.routes');
const serviceRoutes = require('./routes/service.routes');
const paymentRoutes = require('./routes/payments.routes');
const searchRoutes = require('./routes/search.routes');
const eventRoutes = require('./routes/event.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const apiRoutes = require('./routes/apiRoutes');
const lostPetRoutes = require('./routes/lostPet.routes');
const otpRoutes = require('./routes/otp.routes');
const forgotPasswordRoutes = require('./routes/forgotPassword.routes');

app.use('/api', apiRoutes);
// Mount routes under /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/service-provider', serviceProviderRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/mate', mateRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/lost-pets', lostPetRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);


app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'PetVerse API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to PetVerse API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            user: '/api/user',
            seller: '/api/seller',
            serviceProvider: '/api/service-provider',
            admin: '/api/admin',
            pets: '/api/pets',
            products: '/api/products',
            services: '/api/services',
            events: '/api/events',
            cart: '/api/cart',
            search: '/api/search',
            health: '/api/health'
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});


// Server Startup
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`PetVerse API Server Running
      Port: ${port.toString().padEnd(30)}║
      Mode: ${(process.env.NODE_ENV || 'development').padEnd(30)}
      Docs: http://localhost:${port}/api${' '.repeat(8)}
    `);
});

module.exports = app;
