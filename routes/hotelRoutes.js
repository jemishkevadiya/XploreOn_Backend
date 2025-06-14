const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/HotelController'); 

router.get('/destination-code', hotelController.getDestinationCode);
router.get('/hotels', hotelController.getHotelData);
router.get('/room-availability', hotelController.getRoomAvailability);
router.get('/hotel-details', hotelController.getHotelDetails);
router.get('/hotel-photos', hotelController.getHotelPhotos);
router.get('/hotel-facilities', hotelController.getHotelFacilities);
router.get('/filters', hotelController.getHotelFilters);
router.get('/sort', hotelController.getSortOptions);
router.post('/create-hotel-booking', hotelController.createHotelBooking);
module.exports = router;

