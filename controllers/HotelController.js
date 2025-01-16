const { fetchDestinationCode, fetchHotelData } = require('../utils/api');

const getDestinationCode = async (req, res) => {
    const { location } = req.query;
  
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
  
    try {
      const data = await fetchDestinationCode(location);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

const getHotelData = async (req, res) => {
    const { destinationCode, checkIn, checkOut, person } = req.query;
  
    if (!destinationCode || !checkIn || !checkOut || !person) {
      return res.status(400).json({ error: 'All parameters (destinationCode, checkIn, checkOut, person) are required' });
    }
  
    try {
      const data = await fetchHotelData(destinationCode, checkIn, checkOut, person);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

module.exports = { 
  getDestinationCode,
  getHotelData 
};
