const express = require('express');
const router = express.Router();
const flightController = require('../controllers/FlightController');

router.get('/searchFlights', flightController.getFlightSearchResults);  

module.exports = router;
