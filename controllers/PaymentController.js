const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking"); 
const User = require("../models/User"); 
const Payment = require('../models/PaymentModel');
const { sendConfirmationEmail } = require('./EmailController');
const mongoose = require('mongoose');

const processedPayments = new Set(); 

const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentIntentId: req.params.paymentIntentId });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const createCheckoutSession = async (bookingId, totalAmount) => {
  try {
    const expirationTime = Math.floor(Date.now() / 1000) + (30 * 60);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: { name: "xyz" },
            unit_amount: totalAmount * 100
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/success`,
      cancel_url: 'http://localhost:3000/cancel',
      metadata: { bookingId },
      expires_at : expirationTime
    });
    const payment = new Payment({
      paymentIntentId: null,
      amount: totalAmount,
      status: "pending",
      bookingId: bookingId,
      chargeId: session.id,
    })
    await payment.save();
    return session.url
  } catch (error) {
    console.error(' Error creating checkout session:', error);
    throw new Error(error.message);
  }
};

const handlePaymentWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(' Webhook verified:', event.type);
  } catch (err) {
    console.error(` Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      try {
        const session = event.data.object;
        const paymentIntentId = session.payment_intent || null;
        const bookingId = session.metadata.bookingId;
        console.log({ paymentIntentId, bookingId })
     
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          console.error(" Booking not found for ID:", bookingId);
          break;
        }

        const userId = booking.userId; 
        console.log(` Found User ID: ${userId}`);

        const user = await User.findOne({uid: userId});

        if (!user) {
          console.error("User not found for ID:", userId);
          break;
        }

        const email = user.email; 
        console.log(` User Email: ${email}`);

        await Payment.findOneAndUpdate(
          { bookingId },
          { status: "completed", paymentIntentId: paymentIntentId },
          { new: true }
        );

  
        sendConfirmationEmail(email, {
          paymentIntentId,
          amount: session.amount_total,
          service: booking.serviceType,
        });

        console.log(` Email sent to ${email}`);

      } catch (e) {
        console.log(e);
      }
    }
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      try {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        await Booking.deleteById(bookingId);
        await Payment.updateOneAndUpdate(
          {bookingId},
          {status: "failed"},
          {new : true}
        )
        break;
      } catch (e) {
        console.log(e);
      }
    }
    case 'charge.dispute.created': {
      try {
        console.log("Disputed")
        const session = event.data.object;
        const paymentIntentId = session.payment_intent || null;
        const payment = await Payment.updateOneAndUpdate(
          {paymentIntentId},
          {status: "disputed"},
          {new : true}
        )
        await Booking.deleteById(payment.bookingId);

        break;
      } catch (e) {
      }
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

};

module.exports = { createCheckoutSession, handlePaymentWebhook, getPaymentDetails };
