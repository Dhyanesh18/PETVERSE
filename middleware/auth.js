module.exports.isAuthenticated = (req, res, next) => {
    // Add no-cache headers
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    if (req.user) {
      console.log('User authenticated:', req.user.email);
      return next();
    }
    console.log('No authenticated user found');
    res.redirect('/login');
  };