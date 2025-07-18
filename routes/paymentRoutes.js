const express = require('express');
const router = express.Router();
const { createCheckoutSession, handlePaymentWebhook, getPaymentDetails } = require('../controllers/PaymentController');

router.post('/checkout-session', createCheckoutSession);

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  req.setTimeout(10000);

  try {
    await handlePaymentWebhook(req, res);
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook processing failed");
  }
});

router.get('/:paymentIntentId', getPaymentDetails); 

module.exports = router;
