const mongoose = require('mongoose');

const investmentSchema = mongoose.Schema({
    name:{type: String, required: false},
    risk:{type: String, required: false},
    amount:{type: Number, required: false},
});

module.exports = mongoose.model('Investment',investmentSchema);