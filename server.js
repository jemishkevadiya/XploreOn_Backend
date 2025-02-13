// const admin = require('firebase-admin');
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
const airportRoutes = require("./routes/airportRoutes")
const paymentRoutes = require('./routes/paymentRoutes');
const { handlePaymentWebhook } = require('./controllers/PaymentController');

const app = express();

app.post('/payment/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

app.use(cors({ origin: "http://localhost:3000" }));

// // Middleware for parsing JSON (excluding webhooks)
// app.use((req, res, next) => {
//   if (req.originalUrl === '/payment/webhook') {
//     next();
//   } else {
//     express.json()(req, res, next);
//   }
// });

// app.use(async function(req, res, next) {
//   const { authtoken } = req.headers;

//   if (authtoken) {
//     // console.log("Auth TOken", authtoken)
//     const user = await admin.auth().verifyIdToken(authtoken);
//     req.user = user;
//   } else {
//     res.sendStatus(400);
//   }

//   next();
// });
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // Connect to the database
connectDB();
app.use('/user',userRoutes);
// API Routes
app.use("/airports", airportRoutes);
app.use('/flights', flightRoutes);
app.use('/car_rental', carRentalRoutes);
app.use('/hotels', hotelRoutes);
app.use('/payment', paymentRoutes);

// Start the server
const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
