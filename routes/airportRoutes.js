const express = require("express");
const router = express.Router();
const { getAirportsByCity } = require("../controllers/AirportController");

router.get("/search", getAirportsByCity);

module.exports = router;
