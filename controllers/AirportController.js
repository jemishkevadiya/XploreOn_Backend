const fs = require("fs");

let airports = [];

// Load JSON data from file at startup
try {
  const data = fs.readFileSync("./data/airports.json", "utf8");
  airports = JSON.parse(data);
} catch (err) {
  console.error("Error loading airport data:", err);
}

// Function to fetch airport suggestions based on city name
const getAirportsByCity = (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: "City name is required" });
  }

  // Filter airports by city name (case-insensitive)
  const matchingAirports = airports.filter((airport) =>
    airport.city.toLowerCase().includes(city.toLowerCase())
  );

  res.json(matchingAirports);
};

module.exports = { getAirportsByCity };
