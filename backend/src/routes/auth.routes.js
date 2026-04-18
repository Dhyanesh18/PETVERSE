const express = require('express');
const router = express.Router();
const loginController = require('../controllers/login');
const signupController = require('../controllers/signup');
const multer = require('multer');
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// Login routes ----------------------------------------

/**
 * @swagger
 * /api/auth/check-session:
 *   get:
 *     tags: [Auth]
 *     summary: Check if the current session is authenticated
 *     description: Returns user details if a valid session cookie exists, otherwise returns isLoggedIn false.
 *     responses:
 *       200:
 *         description: Session status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isLoggedIn:
 *                   type: boolean
 *                 isAdmin:
 *                   type: boolean
 *                 userRole:
 *                   type: string
 *                   nullable: true
 *                 user:
 *                   type: object
 *                   nullable: true
 */
router.get('/check-session', async (req, res) => {
    try {
        // If the session middleware isn't mounted for some reason, treat as logged out.
        if (!req.session) {
            return res.json({
                success: true,
                isLoggedIn: false,
                isAdmin: false,
                userRole: null,
                user: null
            });
        }

        console.log('Check session - Session userId:', req.session.userId);
        console.log('Check session - User object:', req.user);
        console.log('Check session - Session userRole:', req.session.userRole);

        if (req.session.userId) {
            // If user object is not attached but session exists, try to reload user
            if (!req.user) {
                try {
                    const User = require('../models/users');
                    req.user = await User.findById(req.session.userId);
                    console.log('Reloaded user:', req.user);
                } catch (error) {
                    console.error('Error reloading user:', error);
                    req.session.userId = null;
                    req.session.userRole = null;
                    return res.json({
                        success: true,
                        isLoggedIn: false,
                        isAdmin: false,
                        userRole: null,
                        user: null
                    });
                }
            }

            if (req.user) {
                return res.json({
                    success: true,
                    isLoggedIn: true,
                    isAdmin: req.user.role === 'admin',
                    userRole: req.user.role,
                    user: {
                        id: req.user._id,
                        _id: req.user._id,
                        fullName: req.user.fullName,
                        username: req.user.username,
                        email: req.user.email,
                        phone: req.user.phone,
                        role: req.user.role,
                        isApproved: req.user.isApproved,
                        createdAt: req.user.createdAt,
                        updatedAt: req.user.updatedAt
                    }
                });
            }
        }

        return res.json({
            success: true,
            isLoggedIn: false,
            isAdmin: false,
            userRole: null,
            user: null
        });
    } catch (error) {
        console.error('Unexpected check-session error:', error);
        return res.json({
            success: true,
            isLoggedIn: false,
            isAdmin: false,
            userRole: null,
            user: null
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 redirectPath:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/login', async (req, res) => {
    try {
        // Call the existing login controller but modify response handling
        const result = await loginController.handleLogin(req, res);
        
        // If controller already sent a response, don't send another
        if (res.headersSent) {
            return;
        }
        
        // Determine redirect path based on user role
        let redirectPath = '/';
        if (req.session.userId && req.user) {
            switch(req.user.role) {
                case 'owner':
                    redirectPath = '/owner-dashboard';
                    break;
                case 'seller':
                    redirectPath = '/seller/dashboard';
                    break;
                case 'service_provider':
                    redirectPath = '/service-provider/dashboard';
                    break;
                case 'admin':
                    redirectPath = '/admin/dashboard';
                    break;
            }
            
            return res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: req.user._id,
                    _id: req.user._id,
                    fullName: req.user.fullName,
                    username: req.user.username,
                    email: req.user.email,
                    phone: req.user.phone,
                    role: req.user.role,
                    isApproved: req.user.isApproved,
                    createdAt: req.user.createdAt,
                    updatedAt: req.user.updatedAt
                },
                redirectPath
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error during login',
            message: err.message
        });
    }
});
// -----------------------------------------------------

// Signup routes ---------------------------------------

/**
 * @swagger
 * /api/auth/select-user-type:
 *   post:
 *     tags: [Auth]
 *     summary: Store selected user type in session (first step of signup)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userType]
 *             properties:
 *               userType:
 *                 type: string
 *                 enum: [owner, seller, service_provider]
 *     responses:
 *       200:
 *         description: User type selected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid user type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/select-user-type', async (req, res) => {
    try {
        // Store user type in session or return it
        const { userType } = req.body;
        
        if (!['owner', 'seller', 'service_provider'].includes(userType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user type'
            });
        }
        
        // Store in session for multi-step signup if needed
        req.session.selectedUserType = userType;
        
        return res.json({
            success: true,
            message: 'User type selected',
            userType
        });
    } catch (err) {
        console.error('User type selection error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/auth/signup/owner:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new pet owner account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, username, email, password, phoneNo]
 *             properties:
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phoneNo:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Owner account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or duplicate email/username
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/signup/owner', async (req, res) => {
    try {
        await signupController.handleSignupOwner(req, res);
        
        // If controller already sent response, return
        if (res.headersSent) {
            return;
        }
        
        // Otherwise send success response
        res.json({
            success: true,
            message: 'Owner account created successfully',
            redirectPath: '/login'
        });
    } catch (err) {
        console.error('Owner signup error:', err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Server error during signup',
                message: err.message
            });
        }
    }
});

/**
 * @swagger
 * /api/auth/signup/seller:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new seller account (requires business license upload)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, username, email, password, phoneNo, businessName, license]
 *             properties:
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phoneNo:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               license:
 *                 type: string
 *                 format: binary
 *                 description: Business license document (PDF, max 5MB)
 *     responses:
 *       200:
 *         description: Seller account created, pending admin approval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/signup/seller', upload.single('license'), async (req, res) => {
    try {
        await signupController.handleSignupSeller(req, res);
        
        if (res.headersSent) {
            return;
        }
        
        res.json({
            success: true,
            message: 'Seller account created successfully. Pending admin approval.',
            redirectPath: '/login'
        });
    } catch (err) {
        console.error('Seller signup error:', err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Server error during signup',
                message: err.message
            });
        }
    }
});

/**
 * @swagger
 * /api/auth/signup/service-provider:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new service provider account (requires certificate upload)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, username, email, password, phoneNo, serviceType, certificate]
 *             properties:
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phoneNo:
 *                 type: string
 *               serviceType:
 *                 type: string
 *                 enum: [veterinarian, groomer, trainer, walker]
 *               serviceAddress:
 *                 type: string
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: Professional certificate (PDF, max 5MB)
 *     responses:
 *       200:
 *         description: Service provider account created, pending admin approval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/signup/service-provider', upload.single('certificate'), async (req, res) => {
    try {
        await signupController.handleSignupServiceProvider(req, res);
        
        if (res.headersSent) {
            return;
        }
        
        res.json({
            success: true,
            message: 'Service provider account created successfully. Pending admin approval.',
            redirectPath: '/login'
        });
    } catch (err) {
        console.error('Service provider signup error:', err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Server error during signup',
                message: err.message
            });
        }
    }
});

/**
 * @swagger
 * /api/auth/availability:
 *   post:
 *     tags: [Auth]
 *     summary: Save availability schedule for a service provider
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             example: "09:00"
 *                           end:
 *                             type: string
 *                             example: "17:00"
 *     responses:
 *       200:
 *         description: Availability saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/availability', async (req, res) => {
    try {
        await signupController.saveAvailability(req, res);
        
        if (res.headersSent) {
            return;
        }
        
        res.json({
            success: true,
            message: 'Availability saved successfully'
        });
    } catch (err) {
        console.error('Availability save error:', err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Server error saving availability',
                message: err.message
            });
        }
    }
});

/**
 * @swagger
 * /api/auth/availability:
 *   get:
 *     tags: [Auth]
 *     summary: Get service provider's current availability schedule
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Availability data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     availability:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Only service providers can access availability
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/availability', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        const User = require('../models/users');
        const user = await User.findById(req.session.userId);
        
        if (!user || user.role !== 'service_provider') {
            return res.status(403).json({
                success: false,
                error: 'Only service providers can access availability'
            });
        }
        
        res.json({
            success: true,
            data: {
                availability: user.availability || []
            }
        });
    } catch (err) {
        console.error('Get availability error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: err.message
        });
    }
});
// -----------------------------------------------------

/**
 * @swagger
 * /api/auth/stats:
 *   get:
 *     tags: [Auth]
 *     summary: Get public platform statistics (active users, sellers, etc.)
 *     responses:
 *       200:
 *         description: Platform statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeUsers:
 *                       type: integer
 *                     activeSellers:
 *                       type: integer
 *                     activeServiceProviders:
 *                       type: integer
 *                     petsAvailable:
 *                       type: integer
 */
router.get('/stats', async (req, res) => {
    try {
        const User = require('../models/users');
        const Pet = require('../models/pets');
        
        const [activeUsers, activeSellers, activeServiceProviders, petsAvailable] = await Promise.all([
            User.countDocuments({ role: 'owner' }),
            User.countDocuments({ role: 'seller', isApproved: true }),
            User.countDocuments({ role: 'service_provider', isApproved: true }),
            Pet.countDocuments({ status: 'available' })
        ]);
        
        res.json({
            success: true,
            data: {
                activeUsers,
                activeSellers,
                activeServiceProviders,
                petsAvailable
            }
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error fetching statistics',
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/auth/about:
 *   get:
 *     tags: [Auth]
 *     summary: Get platform data for the About page (same as /stats)
 *     responses:
 *       200:
 *         description: Platform data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeUsers:
 *                       type: integer
 *                     activeSellers:
 *                       type: integer
 *                     activeServiceProviders:
 *                       type: integer
 *                     petsAvailable:
 *                       type: integer
 */
router.get('/about', async (req, res) => {
    try {
        const User = require('../models/users');
        const Pet = require('../models/pets');
        
        const [activeUsers, activeSellers, activeServiceProviders, petsAvailable] = await Promise.all([
            User.countDocuments({ role: 'owner' }),
            User.countDocuments({ role: 'seller', isApproved: true }),
            User.countDocuments({ role: 'service_provider', isApproved: true }),
            Pet.countDocuments({ status: 'available' })
        ]);
        
        res.json({
            success: true,
            data: {
                activeUsers,
                activeSellers,
                activeServiceProviders,
                petsAvailable
            }
        });
    } catch (err) {
        console.error('About data error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error fetching platform data',
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user and destroy the session
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 redirectPath:
 *                   type: string
 *       500:
 *         description: Could not log out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/logout', (req, res) => {
    // Add cache control headers
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    const userId = req.session.userId;
    const logoutTime = new Date().toISOString();

    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'Could not log out',
                message: err.message
            });
        }
        
        res.clearCookie('petverse.sid');
        console.log(`User ${userId} logged out at ${logoutTime}`);
        
        return res.json({
            success: true,
            message: 'You have been successfully logged out.',
            redirectPath: '/login'
        });
    });
});

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     tags: [Auth]
 *     summary: Log out the current user (GET, kept for backward compatibility – prefer POST)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 redirectPath:
 *                   type: string
 */
router.get('/logout', (req, res) => {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    const userId = req.session.userId;
    const logoutTime = new Date().toISOString();

    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'Could not log out',
                message: err.message
            });
        }
        
        res.clearCookie('petverse.sid');
        console.log(`User ${userId} logged out at ${logoutTime}`);
        
        return res.json({
            success: true,
            message: 'You have been successfully logged out.',
            redirectPath: '/login'
        });
    });
});

module.exports = router;