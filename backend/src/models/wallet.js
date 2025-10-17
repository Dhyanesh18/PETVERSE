// models/wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
},{timestamps: true});


// both the methods use atomic operations, so no race condition in concurrent operations

// Add funds
walletSchema.methods.addFunds = async function(amount) {
  if (amount <= 0) throw new Error("Amount must be positive");
  
  const updated = await this.model('Wallet').findOneAndUpdate(
    { _id: this._id },
    { $inc: { balance: amount } },
    { new: true }
  );
  
  this.balance = updated.balance;
  return this;
};

// Deduct funds(with check for sufficient balance)
walletSchema.methods.deductFunds = async function(amount) {
  if (amount <= 0) throw new Error("Amount must be positive");
  
  const updated = await this.model('Wallet').findOneAndUpdate(
    { 
      _id: this._id,
      balance: { $gte: amount } // Atomic balance check
    },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!updated) throw new Error("Insufficient balance");
  this.balance = updated.balance;
  return this;
};

module.exports = mongoose.model('Wallet', walletSchema);