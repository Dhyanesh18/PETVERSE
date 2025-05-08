module.exports.isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.redirect('/login');
};

module.exports.isServiceProvider = (req, res, next) => {
  if (req.user && req.user.role === 'service_provider') {
    return next();
  }
  res.status(403).render('error', {
    message: 'Service Provider access required.'
  });
};
