const mongoose = require('mongoose');

const cardSchema = mongoose.Schema({
  name: { type: String, required: true },
  number: { type: Number, required: true },
  date: { type: String, required: true },
  cvv: { type: Number, required: true },
  bank: { type: String, required: false },
  iban: { type: String, required: false },
  funds: { type: Number, default: 10000, required: false },
});

module.exports = mongoose.model('Card', cardSchema);
