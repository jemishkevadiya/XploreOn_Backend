const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/PaymentModel');
const { sendConfirmationEmail } = require('./EmailController');

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, metadata, email } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: 'Amount and email are required.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'cad',
      payment_method_types: ['card'],
      metadata: metadata || { service: 'general' } // Default metadata if not provided
    });

    // Store payment details in the database
    const paymentRecord = new Payment({
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: 'cad',
      service: metadata?.service || 'general',
      status: paymentIntent.status,
      email: email
    });
    await paymentRecord.save();

    // Send confirmation email
    sendConfirmationEmail(email, {
      paymentIntentId: paymentIntent.id,
      amount: amount,
      service: metadata?.service || 'general'
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook to handle Stripe events
const handlePaymentWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  console.log('Stripe Signature:', sig);
  const payload = req.body;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Stripe needs the raw body to verify the signature
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  const paymentIntent = event.data.object;

  if (event.type === 'payment_intent.created') {
    console.log('🔹 PaymentIntent was created:', paymentIntent);

    // Optionally, log the creation or trigger an action (e.g., notification)
  } else if (event.type === 'payment_intent.succeeded') {
    console.log('✅ Payment successful:', paymentIntent);

    // Update the payment record in the database
    Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      { status: 'succeeded' },
      { new: true },
      (err, updatedPayment) => {
        if (err) {
          console.error('❌ Error updating payment record:', err);
        } else {
          console.log('✅ Payment record updated:', updatedPayment);
        }
      }
    );
  } else if (event.type === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed:', paymentIntent);

    // Update the payment record in the database
    Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      { status: 'failed' },
      { new: true },
      (err, updatedPayment) => {
        if (err) {
          console.error('❌ Error updating payment record:', err);
        } else {
          console.log('✅ Payment record updated with failed status:', updatedPayment);
        }
      }
    );

    // Optionally, notify the user about the failure via email or other methods
  } else {
    console.log(`🔸 Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = { createPaymentIntent, handlePaymentWebhook };
