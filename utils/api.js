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

const fetchHotelData = async (destinationCode, checkIn, checkOut, person, roomQty = 1) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/searchHotels`,  
      {
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
          room_qty: roomQty,  
          page_number: 1,  
          units: 'metric',  
          temperature_unit: 'c',  
          languagecode: 'en-us',  
          currency_code: 'CAD',  
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(' Error fetching hotel data:', error.response?.data || error.message);
    throw new Error('Failed to fetch hotel data');
  }
};


const fetchRoomAvailability = async (hotelId, checkIn, checkOut) => {
  try {
      const response = await axios.get(
          `https://${process.env.API_HOST}/api/v1/hotels/getAvailability`,  
          {
              headers: {
                  'x-rapidapi-key': process.env.API_KEY,  
                  'x-rapidapi-host': process.env.API_HOST,
              },
              params: {
                  hotel_id: hotelId,    
                  min_date: checkIn,    
                  max_date: checkOut,  
                  currency_code: 'CAD'  
              }
          }
      );
      return response.data;
  } catch (error) {
      console.error("Error fetching room availability:", error.response?.data || error.message);
      throw new Error("Failed to fetch room availability");
  }
};

const fetchHotelDetails = async (hotelId, arrivalDate, departureDate) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/getHotelDetails`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          hotel_id: hotelId,  
          arrival_date: arrivalDate,  
          departure_date: departureDate, 
          languagecode: 'en-us',
          currency_code: 'CAD',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(" Error fetching hotel details:", error.response?.data || error.message);
    throw new Error("Failed to fetch hotel details");
  }
};


const fetchHotelPhotos = async (hotelId) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/getHotelPhotos`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          hotel_id: hotelId,
          languagecode: 'en-us',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(" Error fetching hotel photos:", error.response?.data || error.message);
    throw new Error("Failed to fetch hotel photos");
  }
};

const fetchHotelFacilities = async (hotelId) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/getHotelFacilities`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          hotel_id: hotelId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching hotel facilities:", error.response?.data || error.message);
    throw new Error("Failed to fetch hotel facilities");
  }
};

const fetchHotelFilters = async (destinationCode, searchType, arrivalDate, departureDate, adults = 1, roomQty = 1) => {
  try {
      const response = await axios.get(
          `https://${process.env.API_HOST}/api/v1/hotels/getFilter`,
          {
              headers: {
                  'x-rapidapi-key': process.env.API_KEY,
                  'x-rapidapi-host': process.env.API_HOST,
              },
              params: {
                  dest_id: destinationCode,
                  search_type: searchType,
                  arrival_date: arrivalDate,
                  departure_date: departureDate,
                  adults: adults,
                  room_qty: roomQty,
              },
          }
      );
      return response.data;
  } catch (error) {
      console.error("Error fetching hotel filters:", error.response?.data || error.message);
      throw new Error("Failed to fetch hotel filters");
  }
};

const fetchSortOptions = async (destinationCode, searchType, checkIn, checkOut, adults, roomQty = 1) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/hotels/getSortBy`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          dest_id: destinationCode,
          search_type: searchType,
          arrival_date: checkIn,
          departure_date: checkOut,
          adults: adults,
          room_qty: roomQty,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching sort options:", error.response?.data || error.message);
    throw new Error("Failed to fetch sort options");
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
  fetchRoomAvailability,
  fetchHotelDetails,
  fetchHotelPhotos,
  fetchHotelFacilities,
  fetchHotelFilters,
  fetchSortOptions,
  fetchPickupCoordinates,
  fetchDropOffCoordinates,
  searchCarRentals
};
