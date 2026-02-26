const razorpay = require('../config/razorpay');
const paymentService = require('../services/paymentSeervices'); 
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/user');

const createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.result._id;
        
        if (!planId || !userId) {
            return res.status(400).json({ message: "Plan ID or User ID is required" });
        }
        
        const saveOrder = await paymentService.createOrder(planId, userId);
        
        if (!saveOrder) {
            return res.status(404).json({ message: "Plan not found" });
        }
        
        res.status(200).json({
            razorpayOrderId: saveOrder.razorpayOrderId,
            // FIX: Multiply by 100 so frontend Razorpay reads it as Paise (enables UPI)
            amount: saveOrder.amount * 100, 
            currency: "INR",
        });
    } catch (err) {
        console.error("Error creating order:", err.message);
        res.status(500).json({ message: "Failed to create order" });
    }
}

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isVerified = await paymentService.verifyPayment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (isVerified) {
            return res.status(200).json({ message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ message: "Invalid signature" });
        }
    } catch (err) {
        console.error("Payment verification error:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

module.exports = { createOrder, verifyPayment };