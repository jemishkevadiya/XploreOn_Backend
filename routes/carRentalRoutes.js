const express = require('express');
const router = express.Router();
const carRentalController = require('../controllers/CarRentalController');

 
router.get('/search', carRentalController.searchCarRentalsWithCoordinates);
router.post('/carbooking',carRentalController.createCarRentalBooking);

module.exports = router;
