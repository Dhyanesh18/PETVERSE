module.exports = (req, res, next) => {
    if (req.session.userId && (req.user.role === 'admin' || req.user.isAdmin)) {
        return next();
    }
    res.status(403).render('error', { 
        message: 'Admin access required' 
    });
};