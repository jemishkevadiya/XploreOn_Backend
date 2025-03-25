const express = require('express');
const { fetchTourPlaces } = require('../controllers/TourController');  

const router = express.Router();

router.get('/', fetchTourPlaces);

module.exports = router;
