const Plan = require('../models/plan');

const getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find();
        res.status(200).json(plans);
    } catch (err) {
        console.error("Error fetching plans:", err.message);
        res.status(500).json({ message: "Failed to fetch plans" });
    }
};

module.exports = { getAllPlans };
