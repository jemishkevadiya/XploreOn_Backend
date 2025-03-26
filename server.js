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
const restaurantRoutes = require('./routes/restaurantRoutes');
const tourRoutes = require('./routes/tourRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const airportRoutes = require("./routes/airportRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const { handlePaymentWebhook } = require('./controllers/PaymentController');

const app = express();

app.post('/payment/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
admin.initializeApp({ credential: admin.credential.cert(credentials) });

app.use(cors({ origin: "http://localhost:3000" }));

app.use((req, res, next) => {
  if (req.originalUrl === '/payment/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(async function(req, res, next) {
  const { authtoken } = req.headers;
  console.log("Middleware - Method:", req.method, "Path:", req.path, "Authtoken:", authtoken ? "present" : "missing");
  if (authtoken) {
    try {
      const user = await admin.auth().verifyIdToken(authtoken);
      console.log("User verified:", user.uid);
      req.user = user;
    } catch (e) {
      console.log("Token error:", e.message);
      return res.status(401).send("Invalid token");
    }
  } else {
    console.log("No authtoken, rejecting!");
    res.sendStatus(400);
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
connectDB();

app.use('/user', userRoutes);
app.use("/airports", airportRoutes);
app.use('/flights', flightRoutes);
app.use('/car_rental', carRentalRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/tour-places', tourRoutes);
app.use('/itinerary', itineraryRoutes);
app.use('/hotels', hotelRoutes);
app.use('/payment', paymentRoutes);

const PORT = process.env.SERVER_PORT || 1111;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});