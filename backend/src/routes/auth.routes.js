const express = require('express');
const router = express.Router();
const loginController = require('../controllers/login');
const signupController = require('../controllers/signup');
const multer = require('multer');
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// Login routes ----------------------------------------
// Check session/authentication status
router.get('/check-session', (req, res) => {
    if (req.session.userId) {
        return res.json({
            success: true,
            isLoggedIn: true,
            isAdmin: req.user && req.user.role === 'admin',
            userRole: req.user ? req.user.role : null,
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
    } else {
        return res.json({
            success: true,
            isLoggedIn: false,
            isAdmin: false,
            userRole: null,
            user: null
        });
    }
});

// Login endpoint - returns JSON with user data and redirect path
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
// Select user type for signup - just returns success, no rendering needed
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

// Owner signup
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

// Seller signup with license upload
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

// Service provider signup with certificate upload
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

// Save availability for service providers
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

// Get availability data (if needed for editing)
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

// Platform statistics endpoint
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

// About/dashboard data endpoint
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

// Logout endpoint - POST method (more secure)
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
        
        res.clearCookie('connect.sid');
        console.log(`User ${userId} logged out at ${logoutTime}`);
        
        return res.json({
            success: true,
            message: 'You have been successfully logged out.',
            redirectPath: '/login'
        });
    });
});

// Also support GET for backward compatibility, but prefer POST
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
        
        res.clearCookie('connect.sid');
        console.log(`User ${userId} logged out at ${logoutTime}`);
        
        return res.json({
            success: true,
            message: 'You have been successfully logged out.',
            redirectPath: '/login'
        });
    });
});

module.exports = router;