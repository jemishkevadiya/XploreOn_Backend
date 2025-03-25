const { searchLocation, searchRestaurants } = require('../utils/api');  

exports.fetchRestaurantData = async (req, res) => {
  const { destination, cuisine, priceRange } = req.query;

  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    return res.status(400).json({ error: 'Valid destination is required' });
  }

  try {
    const locationId = await searchLocation(destination);
    
    const restaurants = await searchRestaurants(locationId);

    if (restaurants.length === 0) {
      return res.status(404).json({ error: `No restaurants found for ${destination}` });
    }

    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Error in fetchRestaurantData:', error.message);
    res.status(500).json({ error: 'Failed to fetch restaurant data', details: error.message });
  }
};
