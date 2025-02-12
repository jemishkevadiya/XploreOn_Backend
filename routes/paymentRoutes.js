const express = require('express');
const router = express.Router();
const {  handlePaymentWebhook, createCheckoutSession } = require('../controllers/PaymentController');

// router.post('/create-payment-intent', createPaymentIntent);
router.post('/checkout-session', createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

module.exports = router;
