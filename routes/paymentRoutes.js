const express = require('express');
const router = express.Router();
const { createPaymentIntent, handlePaymentWebhook } = require('../controllers/PaymentController');

// Route to create a payment intent
router.post('/create-payment-intent', createPaymentIntent);

// Stripe Webhook route (must be raw JSON)
router.post('/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

module.exports = router;
