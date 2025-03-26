const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const User = require("../models/User");
const Payment = require("../models/PaymentModel");
const { sendConfirmationEmail } = require("./EmailController");

const processedPayments = new Set(); // Prevent duplicate processing

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  console.error("❌ Stripe environment variables are missing!");
  process.exit(1);
}

// Fetch payment details by paymentIntentId
const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentIntentId: req.params.paymentIntentId });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    res.json(payment);
  } catch (error) {
    console.error("❌ Error fetching payment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Create Stripe checkout session
const createCheckoutSession = async (bookingId, totalAmount) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("❌ Booking not found");
    }

    if (!totalAmount || totalAmount <= 0) {
      throw new Error("❌ Invalid total amount");
    }

    const serviceType = booking.serviceType || "Service";
    const expirationTime = Math.floor(Date.now() / 1000) + 30 * 60; // Expires in 30 minutes

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: serviceType },
            unit_amount: totalAmount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/success`,
      cancel_url: `http://localhost:3000/cancel`,
      metadata: { bookingId, serviceType },
      expires_at: expirationTime,
    });

    await Payment.create({
      paymentIntentId: null,
      amount: totalAmount,
      status: "pending",
      bookingId: bookingId,
      chargeId: session.id,
    });

    return session.url;
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    throw new Error(error.message);
  }
};

// Handle Stripe webhook events
const handlePaymentWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Webhook received:", event.type);
  } catch (err) {
    console.error(`❌ Webhook verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object;
    const paymentIntentId = session.payment_intent || null;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      console.error("❌ Missing booking ID in webhook metadata.");
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    if (processedPayments.has(paymentIntentId)) {
      console.log("⚠️ Duplicate webhook event, skipping...");
      return res.status(200).json({ received: true });
    }
    processedPayments.add(paymentIntentId);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(bookingId, paymentIntentId, session);
        break;

      case "payment_intent.succeeded":
        console.log("💰 Payment succeeded:", paymentIntentId);
        break;

      case "payment_intent.created":
        console.log("🔄 Payment intent created:", paymentIntentId);
        break;

      case "charge.succeeded":
        console.log("✅ Charge succeeded:", event.data.object.id);
        break;

      case "charge.updated":
        console.log("🔄 Charge updated:", event.data.object.id);
        break;

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await handleFailedPayment(bookingId, paymentIntentId);
        break;

      case "charge.dispute.created":
        await handleChargeDispute(paymentIntentId);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return res.status(500).json({ error: "Webhook processing error" });
  }
};

// Handle checkout.session.completed event
const handleCheckoutSessionCompleted = async (bookingId, paymentIntentId, session) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.error("❌ Booking not found:", bookingId);
    return;
  }

  if (!booking.userId) {
    console.error("❌ Booking has no associated userId:", bookingId);
    return;
  }

  const user = await User.findOne({ uid: booking.userId });
  if (!user) {
    console.error(`❌ User not found for UID: ${booking.userId}`);
    return;
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    { bookingId },
    { status: "completed", paymentIntentId: paymentIntentId },
    { new: true }
  );

  if (!updatedPayment) {
    console.error("❌ Payment record not found for booking:", bookingId);
    return;
  }

  await sendConfirmationEmail(user.email, {
    paymentIntentId,
    amount: session.amount_total / 100,
    service: booking.serviceType,
  });

  console.log(`📩 Confirmation email sent to ${user.email}`);
};

// Handle failed payments
const handleFailedPayment = async (bookingId, paymentIntentId) => {
  await Booking.findByIdAndDelete(bookingId);
  await Payment.findOneAndUpdate({ paymentIntentId }, { status: "failed" });

  console.log(`❌ Booking and payment marked as failed for ${bookingId}`);
};

// Handle payment disputes
const handleChargeDispute = async (paymentIntentId) => {
  console.log("⚠️ Payment disputed:", paymentIntentId);

  const payment = await Payment.findOneAndUpdate(
    { paymentIntentId },
    { status: "disputed" },
    { new: true }
  );

  if (payment) {
    await Booking.findByIdAndDelete(payment.bookingId);
    console.log(`❌ Booking ${payment.bookingId} deleted due to dispute`);
  }
};

module.exports = { createCheckoutSession, handlePaymentWebhook, getPaymentDetails };
