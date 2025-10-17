const Wallet = require('../models/wallet');

module.exports = async (req, res, next) => {
  if (req.user) {
    req.user.wallet = await Wallet.findOne({ user: req.user._id });
  }
  next();
};