const axios = require('axios');

const resolveAirportCode = async (city) => {
  if (!city) {
    console.error('City name is null or undefined');
    return null;
  }

  try {
    const suggestions = await fetchAirportSuggestions(city);

    if (!suggestions || suggestions.length === 0) {
      console.error(`No suggestions found for city: ${city}`);
      return null;
    }

    const airportSuggestions = suggestions.filter((item) => item.type === 'AIRPORT');

    if (airportSuggestions.length === 0) {
      console.error(`No valid airport found in suggestions for city: ${city}`);
      return null;
    }

    const preferredAirport = airportSuggestions.find((item) =>
      item.airport.toLowerCase().includes('international')
    ) || airportSuggestions[0];

    return `${preferredAirport.code}.AIRPORT`; 
  } catch (error) {
    console.error('Error in resolveAirportCode:', error.message);
    return null;
  }
};

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
    console.log('Received sort parameter:', params.sort);

    const sortParam = params.sort?.toLowerCase() || 'best';

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
          children: params.children,
          cabinClass: params.cabinClass,
          currency_code: 'CAD',
          sort: sortParam,
          pageNo: params.pageNo,
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
      `https://${process.env.API_HOST}/api/v1/hotels/searchDestination`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
        params: {
          query: location,
          languagecode: 'en-us',
        },
      }
    );
    return response.data; 
  } catch (error) {
    console.error('Error fetching destination code:', error.response?.data || error.message);
    throw error; 
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
    console.error('Error fetching hotel data:', error.response?.data || error.message);
    return { hotels: [] };
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

const fetchSortOptions = async (destinationCode, searchType, checkIn, checkOut, adults = 1, roomQty = 1) => {
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


    if (response.data && response.data.data && response.data.data.length > 0) {
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

  
    if (response.data && response.data.data && response.data.data.length > 0) {
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
        currency_code: params.currencyCode || 'CAD',  
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching car rentals:', error.message);
    throw new Error('Failed to fetch car rentals');
  }
};

const searchLocation = async (locationName) => {
  try {
    const response = await axios.get(
      `https://${process.env.RES_API_HOST}/api/v1/restaurant/searchLocation?query=${encodeURIComponent(locationName)}`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.RES_API_HOST,
        },
      }
    );

    if (response.data.status && response.data.data.length > 0) {
      return response.data.data[0].locationId;
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Error fetching locationId:', error);
    throw error;
  }
};

const searchRestaurants = async (locationId) => {
  try {
    const response = await axios.get(
      `https://${process.env.RES_API_HOST}/api/v1/restaurant/searchRestaurants?locationId=${locationId}`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.RES_API_HOST,
        },
      }
    );

    const restaurants = response.data?.data?.data || [];
    return restaurants.map((restaurant) => ({
      name: restaurant.name,
      averageRating: restaurant.averageRating,
      parentGeoName: restaurant.parentGeoName,
      tags: restaurant.establishmentTypeAndCuisineTags,
      thumbnail: restaurant.thumbnail?.photo?.photoSizeDynamic?.urlTemplate
        ? restaurant.thumbnail.photo.photoSizeDynamic.urlTemplate
            .replace('{width}', '200') 
            .replace('{height}', '200') 
        : 'https://via.placeholder.com/200', 
    }));
  } catch (error) {
    console.error('Error fetching restaurants:', error.message);
    throw error;
  }
};

const searchTourLocation = async (locationName) => {
  try {
    const response = await axios.get(
      `https://${process.env.API_HOST}/api/v1/attraction/searchLocation?query=${encodeURIComponent(locationName)}`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': process.env.API_HOST,
        },
      }
    );

    if (response.data.status && response.data.data.destinations && response.data.data.destinations.length > 0) {
      return response.data.data.destinations[0].id;  
    } else {
      console.log('No valid location found in destinations for:', locationName);
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Error fetching locationId:', error.message);
    throw error;  
  }
};

const searchAttractions = async (locationId) => {
  try {
      const response = await axios.get(
          `https://${process.env.API_HOST}/api/v1/attraction/searchAttractions`,
          {
              params: {
                  id: locationId,  
                  sortBy: 'trending',  
                  page: 1,  
                  languagecode: 'en-us', 
              },
              headers: {
                  'x-rapidapi-key': process.env.API_KEY,
                  'x-rapidapi-host': process.env.API_HOST,
              },
          }
      );

      const attractions = response.data?.data?.products || [];
      console.log('Attractions API Response:', JSON.stringify(attractions.slice(0, 2), null, 2)); 

      return attractions.map((attraction) => {
          const imageUrl = attraction.primaryPhoto?.url || 
                          attraction.primaryPhoto?.imageUrl || 
                          attraction.photo?.url || 
                          attraction.images?.[0]?.url || 
                          'https://via.placeholder.com/200';
          return {
              name: attraction.name,
              description: attraction.shortDescription || 'No description available',
              price: attraction.representativePrice?.amount || 'N/A',
              location: attraction.cityName,
              imageUrl: imageUrl,
          };
      });
  } catch (error) {
      console.error('Error fetching tour places:', error.message);
      throw error;
  }
};

module.exports = { 
  resolveAirportCode,
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
  searchCarRentals,
  searchLocation,
  searchRestaurants, 
  searchTourLocation,
  searchAttractions
};
