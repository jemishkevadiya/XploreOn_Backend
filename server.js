const admin = require('firebase-admin');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const carRentalRoutes = require('./routes/carRentalRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const app = express();

// Load Firebase credentials
const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

// Middleware to parse JSON
app.use(express.json());

// Connect to the database
connectDB();

// Routes
app.use('/api/user', userRoutes);

app.use(async function(req, res, next) {
  const { authtoken } = req.headers;

  if (authtoken) {
    const user = await admin.auth().verifyIdToken(authtoken);
    req.user = user;
  } else {
    res.sendStatus(400);
  }

  next();
});
app.use('/api/flights', flightRoutes);
app.use('/api/car_rental', carRentalRoutes);
app.use('/api/hotels', hotelRoutes);

// Start the server
const PORT = process.env.SERVER_PORT; // Fallback to 3000 if SERVER_PORT is not set
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});