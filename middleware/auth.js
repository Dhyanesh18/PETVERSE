module.exports.isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.redirect('/login');
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
