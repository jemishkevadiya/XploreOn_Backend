const express = require('express');
const router = express.Router();
const { createCheckoutSession, handlePaymentWebhook, getPaymentDetails } = require('../controllers/PaymentController');

router.post('/checkout-session', createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);
router.get('/:paymentIntentId', getPaymentDetails); 

module.exports = router;
