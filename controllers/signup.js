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

    handleSignupForm: async (req, res) => {
        try {
            // Validate input
            const { error } = validateSignup(req.body);
            if (error) {
                return res.status(400).render('signup',{error: null});
            }

            // Check if user exists
            const existingUser = await User.findOne({ 
                $or: [
                    { email: req.body.email },
                    { username: req.body.username }
                ] 
            });
            if (existingUser) {
                return res.status(400).render('signup', { 
                    error: 'User with this email or username already exists',
                    formData: req.body 
                });
            }

            // Handle file uploads
            let licenseFileId, certificateFileId;
            
            if (req.files?.license) {
                licenseFileId = await uploadFileToGridFS(
                    req.files.license[0].buffer,
                    req.files.license[0].originalname,
                    { userId: req.body.email }
                );
            }

            if (req.files?.certificate) {
                certificateFileId = await uploadFileToGridFS(
                    req.files.certificate[0].buffer,
                    req.files.certificate[0].originalname,
                    { userId: req.body.email }
                );
            }

            // Create new user (matching your user model fields)
            const user = new User({
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                phone: req.body.phone,
                fullName: req.body.fullName,
                role: req.body.role,
                ...(req.body.role === 'seller' && {
                    businessName: req.body.businessName,
                    license: licenseFileId,
                    isApproved: false // Sellers need approval
                }),
                ...(req.body.role === 'service_provider' && {
                    serviceType: req.body.serviceType,
                    certificate: certificateFileId,
                    isApproved: false // Service providers need approval
                }),
                isApproved: req.body.role === 'owner' // Auto-approve owners
            });

            await user.save();

            // Redirect to login with success message
            req.flash('success', 'Registration successful! You can now login.');
            res.redirect('/login');
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).render('signup', { 
                error: 'Server error during registration',
                formData: req.body 
            });
        }
    }
};