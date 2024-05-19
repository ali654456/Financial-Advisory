const mongoose = require('mongoose');

const investmentSchema = mongoose.Schema({
    name:{type: String, required: false},
    risk:{type: String, required: false},
    roi:{type: String, required: false},
});

module.exports = mongoose.model('Investment',investmentSchema);