const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const paymentWebHook = require('../webHook/paymentHook');
const router = express.Router();

router.post('/create-order', userMiddleware, createOrder);
router.post('/verify-user-payment', userMiddleware, verifyPayment);
router.post('/verify-payment', express.json(), paymentWebHook);

module.exports = router;