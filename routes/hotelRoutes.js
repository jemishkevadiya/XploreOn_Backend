const express= require('express');
const router = express.Router();
const hotelController = require('../controllers/HotelController');

router.get('/destination-code', hotelController.getDestinationCode);
router.get('/hotels', hotelController.getHotelData);
 
module.exports = router;

