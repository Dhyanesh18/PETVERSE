// scripts/initWallets.js
const User = require('../models/users');
const Wallet = require('../models/wallet');
const mongoose = require('mongoose');
const dotenv = require('dotenv');   

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Connection failed:', err));


async function initWallets() {
  const users = await User.find();
  for (const user of users) {
    const existingWallet = await Wallet.findOne({ user: user._id });
    if (!existingWallet) {
      await new Wallet({ user: user._id, balance: 10000 }).save();
      console.log(`Created wallet for ${user.email}`);
    }
  }
}

initWallets().then(() => process.exit());