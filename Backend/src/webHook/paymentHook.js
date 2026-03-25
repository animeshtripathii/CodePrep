const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/user');

const paymentWebHook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    if (!webhookSecret || !signature) {
      return res.status(400).json({ error: 'Missing webhook secret or signature' });
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
    
    const expectedSignature = crypto.createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const providedSignature = String(signature);
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(providedSignature, 'utf8');
    const validSignature =
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer);
      
    if (!validSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const event = Buffer.isBuffer(req.body)
      ? JSON.parse(rawBody.toString('utf8'))
      : req.body;
    
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
      if (user) {
        user.tokens += order.tokens;
        await user.save();
      }
    }
    
  
    return res.json({ success: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);

    return res.status(500).json({ error: 'Webhook handling failed' }); 
  }
};

module.exports = paymentWebHook;