const { fetchFlightSearchResults } = require('../utils/api');

exports.getFlightSearchResults = async (req, res) => {
  const { fromId, toId, departureDate, adults, cabinClass } = req.query;

  try {
    const flightData = await fetchFlightSearchResults({
      fromId,
      toId,
      departureDate,
      adults,
      cabinClass,
    });

    res.status(200).json(flightData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flight search results', error: error.message });
  }
};
