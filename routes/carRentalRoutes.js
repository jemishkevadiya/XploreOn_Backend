const express = require('express');
const router = express.Router();
const carRentalController = require('../controllers/CarRentalController');

router.get('/pickup-coordinates', carRentalController.getPickupCoordinates);  
router.get('/dropoff-coordinates', carRentalController.getDropOffCoordinates);  
router.get('/search', carRentalController.searchCarRentals);  
module.exports = router;
