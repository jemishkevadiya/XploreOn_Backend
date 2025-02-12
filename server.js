const admin = require('firebase-admin');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const carRentalRoutes = require('./routes/carRentalRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const csvParser = require('csv-parser'); 
const app = express();


// Create an array to store the airport data
let airports = [];

// Read the airport-codes.csv file and parse it
fs.createReadStream('airport-codes.csv')  // Your .csv file
  .pipe(csvParser())
  .on('data', (row) => {
    airports.push(row);  // Add each airport's data to the airports array
  })
  .on('end', () => {
    console.log('CSV file successfully processed and data loaded');
  });

// // Load Firebase credentials
// const credentials = JSON.parse(
//   fs.readFileSync('./credentials.json')
// );

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(credentials)
// });

app.use(cors({ origin: "http://localhost:3000" }));
//Middleware to parse JSON
app.use(express.json());

// // Connect to the database
// connectDB();

// Routes
// app.use('/api/user', userRoutes);

// app.use(async function(req, res, next) {
//   const { authtoken } = req.headers;

//   if (authtoken) {
//     const user = await admin.auth().verifyIdToken(authtoken);
//     req.user = user;
//   } else {
//     res.sendStatus(400);
//   }

//   next();
// });
app.use('/user', userRoutes);
app.use('/flights', flightRoutes);
app.use('/car_rental', carRentalRoutes);
app.use('/hotels', hotelRoutes);



app.get('/api/airports', (req, res) => {
  const query = req.query.query ? req.query.query.toLowerCase() : ''; // Get search query from query parameter
  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  // Filter airports based on IATA code, airport name, or country code (iso_country)
  const results = airports.filter(
    (airport) =>
      airport.iata_code.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.iso_country.toLowerCase().includes(query)
  );

  res.json(results); // Return the search results
});



// Start the server
const PORT = process.env.SERVER_PORT; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

connectDB();