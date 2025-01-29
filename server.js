require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const { auth } = require('express-openid-connect');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const carRentalRoutes = require('./routes/carRentalRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const authRoutes = require("./routes/authRoutes");
const app = express();
app.use(express.json());



const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASEURL,
  clientID: process.env.CLIENTID,
  issuerBaseURL: process.env.ISSUER, 
};


connectDB();
app.use(auth(config));

// Place this root route AFTER the auth middleware:
app.get('/', (req, res) => {
  // This line checks whether the user is authenticated.
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});
app.use('/api/user', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/car_rental', carRentalRoutes);
app.use('/api/hotels', hotelRoutes)
app.use('/', authRoutes);  


// Sample endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});