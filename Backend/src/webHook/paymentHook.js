const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/user');

const paymentWebHook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    const expectedSignature = crypto.createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
      
    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const event = JSON.parse(JSON.stringify(req.body));
    
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (!order || order.status === 'success') {
        return res.status(404).json({ error: 'Order not found or already processed' });
      }
      
      order.status = 'success'; 
      order.razorpayPaymentId = payment.id;
      order.razorpaySignature = signature;
      await order.save();
      
      const user = await User.findById(order.user);
      user.tokens += order.tokens;
      await user.save();
    }
    
  
    return res.json({ success: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);

    return res.status(500).json({ error: 'Webhook handling failed' }); 
  }
};

module.exports = paymentWebHook;