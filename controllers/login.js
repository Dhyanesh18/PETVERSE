const User = require('../models/users');

module.exports = {
    showLoginForm: (req, res) => {
        res.render('login', { error: null });
    },

    handleLogin: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user || !(await user.comparePassword(req.body.password))) {
                return res.render('login', { error: 'Invalid credentials' });
            }
            
            // Set session data
            req.session.userId = user._id;
            req.session.userRole = user.role;
            req.session.isAuthenticated = true;

            // Redirect to home page
            res.redirect('/home');
        } catch (err) {
            console.error('Login error:', err);
            res.render('login', { error: 'Server error' });
        }
    }
};