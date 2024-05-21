const mongoose = require('mongoose');
const Card = require('./Card');
const Transaction = require('./Transaction');
const Investment = require('./Investment');

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  wallet: { type: Number, required: true },
  cards: { type: [Card.schema], default: [] },
  investments: { type: [Investment.schema], default: [] },
  transactions: { type: [Transaction.schema], default: [] }
});

module.exports = mongoose.model('User', userSchema);