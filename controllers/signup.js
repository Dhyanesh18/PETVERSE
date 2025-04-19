const User = require("../models/users");
const { uploadFileToGridFS } = require("../config/gridfs");
const { validateSignup } = require("../middleware/validation");

module.exports = {
    showSignupForm: (req, res) => {
        res.render("signup", {error : null});
    },

    profileChoice: (req, res)=>{
        const userType = req.body.userType; 
        switch(userType) {
            case 'owner':
                res.render('signup-owner');
                break;
            case 'seller':
                res.render('signup-seller');
                break;
            case 'service':
                res.render('signup-service');
                break;
            default:
                res.render("signup",{error: "Please choose a user type!"})
        } 
    },

    handleSignupOwner: async (req, res) => {
        try {
            // Basic validation
            if (!req.body || Object.keys(req.body).length === 0) {
                console.error('Empty body received');
                return res.status(400).json({ 
                    message: "Request body is required",
                    received: false
                });
            }
    
            const { email, username, password, fullName, phone } = req.body;
            
            // Field validation
            if (!email || !username || !password || !fullName || !phone) {
                return res.status(400).json({ 
                    message: 'All fields are required',
                    missingFields: {
                        email: !email,
                        username: !username,
                        password: !password,
                        fullName: !fullName,
                        phone: !phone
                    }
                });
            }
    
            // Check existing user
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
    
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'User with this email or username already exists' 
                });
            }
    
            // Create user
            const newUser = await User.create({
                email,
                username,
                password,
                fullName,
                phone,
                role: 'owner'
            });
    
            res.status(201).json({
                message: 'Owner registration successful',
                user: {
                    email: newUser.email,
                    username: newUser.username,
                    fullName: newUser.fullName,
                    role: newUser.role
                }
            });
    
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ 
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};