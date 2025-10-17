const User = require('../models/users');

module.exports = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/login');
        }
        
        // Get user from database to verify role
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        
        // Attach user to request for later use
        req.user = user;
        
        if (user.role === 'admin') {
            return next();
        }
        
        // Not an admin, redirect to home
        return res.status(403).render('error', { 
            message: 'Admin access required' 
        });
    } catch (err) {
        console.error('Admin auth error:', err);
        return res.status(500).render('error', {
            message: 'Server error during authentication'
        });
    }
};