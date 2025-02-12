const admin = require('firebase-admin');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
const connectDB = require('./config/db');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const carRentalRoutes = require('./routes/carRentalRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { handlePaymentWebhook } = require('./controllers/PaymentController');

const app = express();

// Stripe Webhook needs raw body parsing
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

// Uncomment below if Firebase is required
// const credentials = JSON.parse(
//   fs.readFileSync('./credentials.json')
// );

// admin.initializeApp({
//   credential: admin.credential.cert(credentials)
// });

app.use(cors({ origin: "http://localhost:3000" }));

// Middleware for parsing JSON (excluding webhooks)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the database
connectDB();

// API Routes
app.use('/api/flights', flightRoutes);
app.use('/api/car_rental', carRentalRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/payment', paymentRoutes);

// Payment Status API Route
const Payment = require('./models/PaymentModel');
app.get('/api/payment/:paymentIntentId', async (req, res) => {
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
});

// Start the server
const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
