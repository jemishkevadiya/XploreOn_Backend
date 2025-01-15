const axios = require('axios');

// Function to fetch flight search results
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

// Function to fetch destination code
const fetchDestinationCode = async (location) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/searchDestination`, {
      headers: {
        'x-rapidapi-key': process.env.API_KEY,
        'x-rapidapi-host': process.env.API_HOST,
      },
      params: {
        query: location,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching destination code:', error.message);
    throw new Error('Failed to fetch hotel search location');
  }
};

// Function to fetch hotel data
const fetchHotelData = async (destinationCode, checkIn, checkOut, person) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/searchHotels`, {
      headers: {
        'x-rapidapi-key': process.env.API_KEY,
        'x-rapidapi-host': process.env.API_HOST,
      },
      params: {
        dest_id: destinationCode,
        search_type: 'CITY',
        arrival_date: checkIn,
        departure_date: checkOut,
        adults: person,
        children_age: '0,17',
        room_qty: 1,
        page_number: 1,
        units: 'metric',
        temperature_unit: 'c',
        languagecode: 'en-us',
        currency_code: 'CAD',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching hotel data:', error.message);
    throw new Error('Failed to fetch hotel data');
  }
};

// Exporting functions using CommonJS syntax
module.exports = { 
  fetchFlightSearchResults, 
  fetchDestinationCode, 
  fetchHotelData 
};
