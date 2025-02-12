const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/PaymentModel');
const { sendConfirmationEmail } = require('./EmailController');

const createCheckoutSession = async (req, res) => {
  try {
    const { items, service, email } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid items are required.' });
    }

    if (!service || !email) {
      return res.status(400).json({ error: 'Service type and email are required.' });
    }

    const totalAmount = items.reduce((total, item) => {
      const itemAmount = Number(item.price_data?.unit_amount); // Extract from price_data
      const itemQuantity = Number(item.quantity);

      if (isNaN(itemAmount) || isNaN(itemQuantity) || itemAmount < 0 || itemQuantity < 1) {
        throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
      }

      return total + itemAmount * itemQuantity;
    }, 0);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be a positive integer.' });
    }

    const amountInCents = Math.round(totalAmount);

    // Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'cad',
      payment_method_types: ['card'],
      metadata: { service, email },
    });

    // Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items, // Use as received
      mode: 'payment',
      success_url: `http://localhost:3000/success`,
      cancel_url: 'http://localhost:3000/cancel',
      metadata: { service, email },
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};
// Webhook
const handlePaymentWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  console.log("Stripe-Signature: ", sig);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook verified:', event.type);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventData = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Checkout Session Completed:', eventData);

      const { service, email } = eventData.metadata;

      try {
        const newPayment = new Payment({
          paymentIntentId: eventData.payment_intent,
          amount: eventData.amount_total,
          currency: eventData.currency,
          service: service || 'unknown',
          status: eventData.payment_status,
          email: email || 'N/A',
        });

        await newPayment.save();
        console.log('✅ New payment record saved:', newPayment);

        // Send confirmation email
        sendConfirmationEmail(email, {
          paymentIntentId: eventData.payment_intent,
          amount: eventData.amount_total, // Convert to dollars
          service: service,
        });

      } catch (error) {
        console.error('❌ Error handling payment webhook:', error);
      }
      break;

    case 'payment_intent.succeeded':
      console.log('✅ Payment successful:', eventData);
      try {
        const updatedPayment = await Payment.findOneAndUpdate(
          { paymentIntentId: eventData.id },
          { status: 'succeeded' },
          { new: true }
        );

        console.log('✅ Payment record updated:', updatedPayment);
      } catch (error) {
        console.error('❌ Error updating payment record:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', eventData);
      try {
        await Payment.findOneAndUpdate(
          { paymentIntentId: eventData.id },
          { status: 'failed' },
          { new: true }
        );
        console.log('✅ Payment record updated with failed status.');
      } catch (error) {
        console.error('❌ Error updating failed payment record:', error);
      }
      break;

    case 'payment_intent.created':
      console.log('✅ Payment Intent Created:', eventData);
      try {
        console.log(`PaymentIntent created with ID: ${eventData.id}`);
      } catch (error) {
        console.error('❌ Error handling payment intent creation:', error);
      }
      break;

    case 'charge.succeeded':
      console.log('✅ Charge succeeded:', eventData);
      try {
        const charge = eventData;
        const paymentIntentId = charge.payment_intent;

        const updatedPayment = await Payment.findOneAndUpdate(
          { paymentIntentId: paymentIntentId },
          { status: 'succeeded', chargeId: charge.id },
          { new: true }
        );

        console.log('✅ Payment record updated with charge details:', updatedPayment);
      } catch (error) {
        console.error('❌ Error handling charge succeeded:', error);
      }
      break;

    case 'charge.updated':
      console.log('✅ Charge updated:', eventData);
      try {
        const charge = eventData;
        const paymentIntentId = charge.payment_intent;

        const updatedPayment = await Payment.findOneAndUpdate(
          { paymentIntentId: paymentIntentId },
          { chargeStatus: charge.status }, 
          { new: true }
        );

        console.log('✅ Payment record updated with charge status:', updatedPayment);
      } catch (error) {
        console.error('❌ Error handling charge update:', error);
      }
      break;

    default:
      console.log(`🔸 Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = { createCheckoutSession, handlePaymentWebhook };
