module.exports.isAuthenticated = (req, res, next) => {
    // Add no-cache headers
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    console.log('Auth middleware - Session:', req.session);
    console.log('Auth middleware - User ID in session:', req.session.userId);
    
    if (req.user) {
      console.log('User authenticated:', req.user.email, 'Role:', req.user.role);
      return next();
    } else if (req.session && req.session.userId) {
      console.log('User ID in session but user object not populated. This could be a middleware order issue.');
      return res.redirect('/login'); // Redirect to login as user object wasn't properly loaded
    }
    console.log('No authenticated user found in request');
    res.redirect('/login');
  };