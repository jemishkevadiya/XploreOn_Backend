const express = require('express');
const { fetchRestaurantData } = require('../controllers/RestaurantController');  

const router = express.Router();

router.get('/', fetchRestaurantData);

module.exports = router;
