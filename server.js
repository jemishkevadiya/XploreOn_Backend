require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const carRentalRoutes = require('./routes/carRentalRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const app = express();
app.use(express.json());

connectDB();

app.use('/api/user', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/car_rental', carRentalRoutes);
app.use('api/hotels', hotelRoutes)

const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});