const express = require('express');
const router = express.Router();
const loginController = require('../controllers/login');
const signupController = require('../controllers/signup');
const multer = require('multer');
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});


// Login routes ----------------------------------------
router.get('/login', loginController.showLoginForm);
router.post('/login', loginController.handleLogin);
// -----------------------------------------------------

// Signup routes ---------------------------------------
router.post('/select-user-type', signupController.profileChoice); // Select the type of user for signing up
router.get('/signup', signupController.showSignupForm);
router.post('/signup/owner', signupController.handleSignupOwner);
router.post('/signup/seller', upload.single('license'), signupController.handleSignupSeller);
router.post('/signup/service-provider', upload.single('certificate'), signupController.handleSignupServiceProvider);
// -----------------------------------------------------


router.get('/dashboard', (req, res)=>{
    res.render('about', {
        activeUsers : 100,
        activeSellers : 15,
        activeServiceProviders: 10,
        petsAvailable: 250
    });
});





router.get('/logout', (req, res)=>{
    const userId = req.session.userId;
    const logoutTime = new Date().toISOString();

    req.session.destroy(err=>{
        if (err){
            console.error('Logout error:', err);
            return res.status(500).send('Could not log out');
        }
        res.clearCookie('connect.sid');
        console.log(`User ${userId} logged out at ${logoutTime}`);
        res.redirect('/login');
    });
});

module.exports = router;