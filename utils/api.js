const axios = require('axios');

const fetchAirportSuggestions = async (cityName) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/flights/searchDestination`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: { query: cityName },
      }
    );

    return response.data.data.map((item) => ({
      city: item.cityName,
      airport: item.name,
      code: item.code,
      type: item.type,
    }));
  } catch (error) {
    console.error('Error fetching airport suggestions:', error.message);
    throw new Error('Failed to fetch airport suggestions');
  }
};

const fetchFlightSearchResults = async (params) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/flights/searchFlights`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          fromId: params.fromId,
          toId: params.toId,
          departDate: params.departureDate,
          returnDate: params.returnDate ? params.returnDate : undefined, 
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

const fetchPickupCoordinates = async (pickupLocation) => {
  try {
    const response = await axios.get(`https://${process.env.API_HOST}/api/v1/cars/searchDestination`, {
      headers: {
        'X-Rapidapi-Key': process.env.API_KEY,
        'X-Rapidapi-Host': process.env.API_HOST,
      },
      params: { query: pickupLocation },
    });
    if (response.data.status && response.data.data.length > 0) {
      const coordinates = response.data.data[0].coordinates;
      return { latitude: coordinates.latitude, longitude: coordinates.longitude };
    } else {
      return null;  
    }
  } catch (error) {
    console.error('Error fetching pickup coordinates:', error.message);
    throw new Error('Failed to fetch pickup coordinates');
  }
};
const fetchDropOffCoordinates = async (dropOffLocation) => {
  try {
    const response = await axios.get(`https://${process.env.API_HOST}/api/v1/cars/searchDestination`, {
      headers: {
        'X-Rapidapi-Key': process.env.API_KEY,
        'X-Rapidapi-Host': process.env.API_HOST,
      },
      params: { query: dropOffLocation },
    });
    if (response.data.status && response.data.data.length > 0) {
      const coordinates = response.data.data[0].coordinates;
      return { latitude: coordinates.latitude, longitude: coordinates.longitude };
    } else {
      return null; 
    }
  } catch (error) {
    console.error('Error fetching drop-off coordinates:', error.message);
    throw new Error('Failed to fetch drop-off coordinates');
  }
};
const searchCarRentals = async (params) => {
  try {
    const response = await axios.get(`https://${process.env.API_HOST}/api/v1/cars/searchCarRentals`, {
      headers: {
        'X-Rapidapi-Key': process.env.API_KEY,
        'X-Rapidapi-Host': process.env.API_HOST,
      },
      params: {
        pick_up_latitude: params.pickUpCoordinates.latitude,
        pick_up_longitude: params.pickUpCoordinates.longitude,
        drop_off_latitude: params.dropOffCoordinates.latitude,
        drop_off_longitude: params.dropOffCoordinates.longitude,
        pick_up_date: params.pickUpDate,
        drop_off_date: params.dropOffDate,
        pick_up_time: params.pickUpTime,
        drop_off_time: params.dropOffTime,
        currency_code: 'CAD'
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching car rentals:', error.message);
    throw new Error('Failed to fetch car rentals');
  }
};

module.exports = { 
  fetchAirportSuggestions,
  fetchFlightSearchResults, 
  fetchDestinationCode, 
  fetchHotelData,
  fetchPickupCoordinates,
  fetchDropOffCoordinates,
  searchCarRentals
};
