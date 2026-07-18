const razorpay = require("../config/razorpay");
const Plan = require("../models/plan");
const Order = require("../models/Order");
const { sendPlanActivationEmail } = require('../utils/emailService');

const createOrder = async (planId, userId) => {
  try {
    const plan = await Plan.findById(planId);

    if (!plan) {
      return null;
    }
    const options = {
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    const totalTokens = plan.tokens + plan.bonusTokens;
    const newOrder = new Order({
      user: userId,
      plan: plan._id,
      amount: plan.price,
      status: 'pending',
      razorpayOrderId: order.id,
      tokens: totalTokens
    });
    await newOrder.save();
    return newOrder;
  } catch (err) {
    throw new Error("Failed to create Razorpay order");
  }
};

const verifyPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const crypto = require('crypto');
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).populate('plan');
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== 'success') {
      order.status = 'success';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      await order.save();

      const User = require('../models/user');
      const user = await User.findById(order.user);
      user.tokens += order.tokens;
      await user.save();

      // Send plan activation email
      try {
        const planName = order.plan?.name || 'Token Pack';
        const planDetails = {
          planName,
          tokensAdded: order.tokens,
          baseTokens: order.plan?.tokens || order.tokens,
          bonusTokens: order.plan?.bonusTokens || 0,
          totalBalance: user.tokens,
          amountPaid: order.amount,
          userName: user.firstName
        };
        await sendPlanActivationEmail(user.emailId, planDetails);
      } catch (emailErr) {
        console.error("Plan activation email failed:", emailErr.message);
        // Don't throw — payment was still successful
      }
    }
    return true;
  } else {
    return false;
  }
};

module.exports = { createOrder, verifyPayment };
