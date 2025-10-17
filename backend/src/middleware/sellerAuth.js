module.exports = (req, res, next) => {
    // Add cache control headers to prevent caching
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    // Check if user exists in request (populated from session)
    if (!req.user) {
        console.log('No user found in request');
        return res.redirect('/login');
    }
    
    // Check if user is a seller or admin
    if (req.user.role === 'seller' || req.user.role === 'admin') {
        console.log('Seller/Admin authenticated:', req.user.email);
        return next();
    }
    
    console.log('Not a seller or admin:', req.user.role);
    res.status(403).render('error', { 
        message: 'Seller access required. Please ensure your account is approved.' 
    });
};