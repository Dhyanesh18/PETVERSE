module.exports.isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  
  // Check if it's an API request - check path first, then headers
  if (req.originalUrl.includes('/api/') || req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      isLoggedIn: false
    });
  }
  
  // For web pages, redirect to login (but don't redirect if already on login page)
  if (req.path !== '/login' && !req.path.startsWith('/login')) {
    return res.redirect('/login');
  }
  
  // If already on login page, allow access
  next();
};

module.exports.isServiceProvider = (req, res, next) => {
  // Allow admin to view service provider dashboard
  if (req.user && (req.user.role === 'service_provider' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).render('error', {
    message: 'Service Provider access required.'
  });
};
