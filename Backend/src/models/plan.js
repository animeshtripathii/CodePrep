const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    tokens: { type: Number, required: true },
    bonusTokens: { type: Number, required: true }
});

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;