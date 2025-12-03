const User = require('../models/users');

module.exports = {
    showLoginForm: (req, res) => {
        res.render('login', { error: null });
    },

    handleLogin: async (req, res) => {
        try {
            console.log('Login attempt for email:', req.body.email);
            
            const user = await User.findOne({ email: req.body.email });
            
            if (!user) {
                console.log('No user found with email:', req.body.email);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid email or password' 
                });
            }
            
            const passwordMatch = await user.comparePassword(req.body.password);
            if (!passwordMatch) {
                console.log('Password mismatch for user:', req.body.email);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid email or password' 
                });
            }
            
            console.log('Session object before login:', req.session);
    
            req.session.userId = user._id;
            req.session.userRole = user.role;
          
            console.log('Session after login:', req.session);
            console.log('User authenticated successfully:', user.email, 'with role:', user.role);
            
            // Return JSON response with complete user data
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    _id: user._id,
                    fullName: user.fullName,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isApproved: user.isApproved,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                userRole: user.role
            });

        } catch (err) {
            console.error('Login error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Server error. Please try again later.' 
            });
        }
    }
};