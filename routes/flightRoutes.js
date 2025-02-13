const express = require('express');
const router = express.Router();
const flightController = require('../controllers/FlightController');

router.get('/getAirportSuggestions', flightController.getAirportSuggestions);
router.get('/searchFlights', flightController.getFlightSearchResults);  
router.post('/flightbooking',flightController.createFlightBooking);
module.exports = router;
