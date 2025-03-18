const { searchTourLocation, searchAttractions } = require('../utils/api');  

exports.fetchTourPlaces = async (req, res) => {
    const { destination } = req.query;
  
    if (!destination || typeof destination !== 'string' || destination.trim() === '') {
      return res.status(400).json({ error: 'Valid destination is required' });
    }
  
    try {
      const locationId = await searchTourLocation(destination);
      if (!locationId) {
        return res.status(404).json({ error: `No location found for ${destination}` });
      }
  
      const tourPlaces = await searchAttractions(locationId);
  
      if (tourPlaces.length === 0) {
        return res.status(404).json({ error: `No tour places found for ${destination}` });
      }
  
      res.status(200).json(tourPlaces);
    } catch (error) {
      console.error('Error in fetchTourPlaces:', error.message);
      res.status(500).json({ error: 'Failed to fetch tour places', details: error.message });
    }
  };
  
