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
                return res.render('login', { error: 'Invalid email or password' });
            }
            
            const passwordMatch = await user.comparePassword(req.body.password);
            if (!passwordMatch) {
                console.log('Password mismatch for user:', req.body.email);
                return res.render('login', { error: 'Invalid email or password' });
            }
            
            console.log('Session object before login:', req.session);
    
            req.session.userId = user._id;
            req.session.userRole = user.role;
          
            console.log('Session after login:', req.session);
            console.log('User authenticated successfully:', user.email, 'with role:', user.role);
            
            // Redirect based on user role
            if (user.role === 'admin') {
                res.redirect('/admin/dashboard');
            } else if (user.role === 'seller') {
                res.redirect('/seller/dashboard');
            } else if (user.role === 'service_provider') {
                res.redirect('/service-provider/dashboard');
            } else if (user.role === 'owner') {
                res.redirect('/owner-dashboard');
            } else {
                res.redirect('/home');

            }

        } catch (err) {
            console.error('Login error:', err);
            res.render('login', { error: 'Server error. Please try again later.' });
        }
    }
};