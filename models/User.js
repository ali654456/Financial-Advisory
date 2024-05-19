const mongoose = require('mongoose');
const Card = require('./Card');
const Investment = require('./Investment');
const Transaction = require('./Transaction');

const userSchema = mongoose.Schema({
    username:{type: String, required: true},
    email:{type: String, required: true},
    password:{type: String, required: true},
    cards: { type: [Card.schema], default: [] },
    investments: { type: [Investment.schema], default: [] },
    transacions: { type: [Transaction.schema], default: [] }
});

module.exports = mongoose.model('User',userSchema);