require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('./src/models/plan');
const connectDB = require('./src/config/db');

async function seedPlans() {
    await connectDB();

    const plans = [
        { name: 'Basic', price: 99, tokens: 200, bonusTokens: 0 },
        { name: 'Standard', price: 199, tokens: 200, bonusTokens: 20 },
        { name: 'Premium', price: 299, tokens: 300, bonusTokens: 40 }
    ];

    try {
        await Plan.deleteMany({}); // clearing existing plans to avoid duplicates
        await Plan.insertMany(plans);
        console.log("Plans seeded successfully");
    } catch (err) {
        console.error("Error seeding plans:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedPlans();
