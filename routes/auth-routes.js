const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({storage: multer.memoryStorage()});
const loginController = require('../controllers/login');
const signupController = require('../controllers/signup');

router.get('/login', loginController.showLoginForm);
router.post('/login', loginController.handleLogin);

router.get('/signup', signupController.showSignupForm);


router.post('/signup/owner', signupController.handleSignupOwner);

router.get('/dashboard', (req, res)=>{
    res.render('about', {
        activeUsers : 100,
        activeSellers : 15,
        activeServiceProviders: 10,
        petsAvailable: 250
    });
});

router.post('/select-user-type', signupController.profileChoice);



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