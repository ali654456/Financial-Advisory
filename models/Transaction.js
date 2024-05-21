const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
  bankAccount: { type: String, required: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);