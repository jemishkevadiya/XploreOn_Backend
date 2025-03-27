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

//  Stripe Webhook Route (Handled Separately)
app.post('/payment/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
admin.initializeApp({ credential: admin.credential.cert(credentials) });

app.use(cors({ origin: process.env.APP_API_URL }));


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
      return res.status(401).json({ message: "Invalid token" });
    }
  }
 
  next();

});

app.use(express.json());
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
// Add a root route to test deployment
app.get('/', (req, res) => {
  res.status(200).json({ message: "XploreOn Backend is live!" });
});

const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

