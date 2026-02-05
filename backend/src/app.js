const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// ===== THIRD-PARTY MIDDLEWARE =====

// 1. Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow cross-origin resources
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resources
}));

// 2. Compression middleware
app.use(compression());

// 3. Rate limiting - Global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// 4. Create rotating write stream for access logs
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // Rotate daily
    path: logsDir,
    maxFiles: 30 // Keep 30 days of logs
});

// 5. HTTP request logger - Morgan
app.use(morgan('combined', { stream: accessLogStream })); // File logging
app.use(morgan('dev')); // Console logging

// 6. CORS configuration
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000', 
        'http://localhost:3001',
        'http://localhost:5173'
    ],
    credentials: true, // Allow cookies/session
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token'],
    exposedHeaders: ['set-cookie']
};
app.use(cors(corsOptions));

// ===== BUILT-IN MIDDLEWARE =====

// 7. Body parsers
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// 8. Static file serving
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 9. Data sanitization against NoSQL injection
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized potentially malicious input: ${key}`);
    }
}));

// ===== APPLICATION-LEVEL MIDDLEWARE =====

// 10. Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false, 
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    },
    name: 'petverse.sid' 
}));

// 11. CSRF Protection (excluding API routes for API clients, but you can customize)
const csrfProtection = csurf({ 
    cookie: false // Using session-based CSRF
});

// Apply CSRF to non-API routes only (if you have web forms)
// For API routes, you may want to skip CSRF or use token-based auth instead
app.use((req, res, next) => {
    // Skip CSRF for API routes - typically APIs use JWT/token auth
    if (req.path.startsWith('/api/')) {
        return next();
    }
    csrfProtection(req, res, next);
});

// 12. Make CSRF token available to views
app.use((req, res, next) => {
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next();
});

// ===== CUSTOM MIDDLEWARE =====

// 13. User authentication middleware - Attach user to req
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

// ===== ERROR HANDLING MIDDLEWARE =====

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);


// Server Startup
const port = process.env.PORT || 8080;
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173'
        ],
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Socket.io connection handling
const Chat = require('./models/chat');

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join chat room
    socket.on('joinChat', async ({ orderId, userId, userRole }) => {
        try {
            socket.join(`order_${orderId}`);
            console.log(`User ${userId} (${userRole}) joined chat for order ${orderId}`);
            
            // Load existing messages
            const chat = await Chat.findOne({ orderId })
                .populate('customer', 'fullName email')
                .populate('seller', 'fullName businessName email');
            
            if (chat) {
                socket.emit('chatHistory', chat.messages);
            }
        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', 'Failed to join chat');
        }
    });

    // Send message
    socket.on('sendMessage', async ({ orderId, senderId, message }) => {
        try {
            let chat = await Chat.findOne({ orderId });
            
            if (!chat) {
                // Get order details to create chat
                const Order = require('./models/order');
                const order = await Order.findById(orderId);
                
                if (!order) {
                    socket.emit('error', 'Order not found');
                    return;
                }
                
                chat = new Chat({
                    orderId,
                    customer: order.customer,
                    seller: order.seller
                });
            }
            
            const newMessage = {
                sender: senderId,
                content: message,
                timestamp: new Date(),
                read: false
            };
            
            chat.messages.push(newMessage);
            chat.lastMessage = new Date();
            await chat.save();
            
            // Populate sender info
            await chat.populate('messages.sender', 'fullName businessName');
            const populatedMessage = chat.messages[chat.messages.length - 1];
            
            // Emit to all users in the room
            io.to(`order_${orderId}`).emit('newMessage', {
                _id: populatedMessage._id,
                sender: {
                    _id: populatedMessage.sender._id,
                    name: populatedMessage.sender.fullName || populatedMessage.sender.businessName
                },
                content: populatedMessage.content,
                timestamp: populatedMessage.timestamp
            });
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Mark messages as read
    socket.on('markAsRead', async ({ orderId, userId }) => {
        try {
            const chat = await Chat.findOne({ orderId });
            if (chat) {
                chat.messages.forEach(msg => {
                    if (msg.sender.toString() !== userId.toString()) {
                        msg.read = true;
                    }
                });
                await chat.save();
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`PetVerse API Server Running
      Port: ${port.toString().padEnd(30)}║
      Mode: ${(process.env.NODE_ENV || 'development').padEnd(30)}
      Docs: http://localhost:${port}/api${' '.repeat(8)}
    `);
});

module.exports = { app, io };
