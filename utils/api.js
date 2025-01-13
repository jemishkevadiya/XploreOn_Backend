const axios = require('axios');

const fetchFlightSearchResults = async (params) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/flights/searchFlights`, {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          fromId: params.fromId,
          toId: params.toId,
          departDate: params.departureDate,
          adults: params.adults,
          cabinClass: params.cabinClass,
          currency_code: 'CAD',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in fetchFlightSearchResults:', error.message);
    throw new Error('Failed to fetch flight search results');
  }
};

module.exports = { fetchFlightSearchResults };
