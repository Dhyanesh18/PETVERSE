module.exports = (req, res, next) => {
    // Check if user exists in session
    if (!req.session.userId || !req.session.userRole) {
        return res.redirect('/login');
    }
    
    // Check if user is approved seller
    if (req.session.userRole === 'seller' /*&& req.session.isApproved*/) {
        return next();
    }
    
    res.status(403).render('error', { 
        message: 'Seller access required. Please ensure your account is approved.' 
    });
};