module.exports = (req, res, next) => {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    // If user is logged in, proceed to the next middleware/route handler
    next();
}; 