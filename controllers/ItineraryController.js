const { fetchAirportSuggestions, fetchFlightSearchResults, fetchHotelData, fetchPickupCoordinates, 
    fetchDropOffCoordinates, searchTourLocation, searchRestaurants, searchAttractions, searchCarRentals, 
    searchLocation } = require('../utils/api');
const { retrieveDestinationCode } = require('../controllers/HotelController');

const resolveAirportCode = async (city) => {
    if (!city || typeof city !== 'string' || city.trim() === '') {
        return null;
    }

    try {
        const suggestions = await fetchAirportSuggestions(city);
        if (!suggestions || suggestions.length === 0) return null;

        const airportSuggestions = suggestions.filter((item) => item.type === 'AIRPORT');
        if (airportSuggestions.length === 0) return null;

        const preferredAirport = airportSuggestions.find((item) =>
            item.airport.toLowerCase().includes('international')
        ) || airportSuggestions[0];

        return `${preferredAirport.code}.AIRPORT`; 
    } catch (error) {
        console.error('Error in resolveAirportCode:', error.message);
        return null;
    }
};

exports.generateItinerary = async (req, res) => {
    const { origin, destination, fromDate, toDate, services, budget, budgetPercentage } = req.body;

    if (!origin || !destination || !fromDate || !toDate || !services || !Array.isArray(services)) {
        return res.status(400).json({ 
            error: 'Missing or invalid required fields', 
            details: 'origin, destination, fromDate, toDate, and services (array) are required' 
        });
    }

    let itinerary = {
        flights: null,
        hotels: [],
        carRentals: null,
        restaurants: null,
        tourPlaces: null,
    };

    try {
        if (services.includes('Flight')) {
            let originCode = origin;
            if (!originCode.includes('.')) {
                originCode = await resolveAirportCode(origin);
                if (!originCode) throw new Error(`Failed to resolve airport code for origin: ${origin}`);
            }

            let destCode = destination;
            if (!destCode.includes('.')) {
                destCode = await resolveAirportCode(destination);
                if (!destCode) throw new Error(`Failed to resolve airport code for destination: ${destination}`);
            }

            const flightParams = {
                fromId: originCode,
                toId: destCode,
                departureDate: fromDate,
                returnDate: toDate,
                adults: 1,
                children: 0,
                cabinClass: 'economy',
                sort: 'best',
                pageNo: 1
            };
            itinerary.flights = await fetchFlightSearchResults(flightParams);
        }

        if (services.includes('Hotel')) {
            try {
                const destinationData = await retrieveDestinationCode(destination);
                console.log('Destination Data:', destinationData);
        
                if (!destinationData || !destinationData.destinationCode) {
                    console.error('Invalid destination code:', destinationData);
                    itinerary.hotels = [];
                } else {
                    const destinationCode = destinationData.destinationCode;
                    let data = await fetchHotelData(destinationCode, fromDate, toDate, 1, 1);
                    console.log('Hotel Data:', data);
        
                    if (data && data.data && data.data.hotels && data.data.hotels.length > 0) {
                        itinerary.hotels = data.data.hotels.map(hotel => ({
                            name: hotel.name,
                            price: hotel.property.priceBreakdown.grossPrice.value,
                            reviewScore: hotel.property.reviewScore,
                            reviewCount: hotel.property.reviewCount,
                            photoUrl: hotel.property.photoUrls[0],
                            checkInDate: hotel.property.checkinDate,
                            checkOutDate: hotel.property.checkoutDate,
                            hotelId: hotel.hotel_id,
                            location: {
                                latitude: hotel.property.latitude,
                                longitude: hotel.property.longitude,
                            }
                        }));
                        console.log('Assigning hotels:', itinerary.hotels.length, 'hotels found');
                    } else {
                        console.error('No valid hotel data received.');
                        itinerary.hotels = [];
                    }
                }
            } catch (error) {
                console.error('Error fetching hotel data:', error.message);
                itinerary.hotels = [];
            }
        }

        if (services.includes('Car Rental')) {
            const pickUpCoordinates = await fetchPickupCoordinates(destination);
            const dropOffCoordinates = await fetchDropOffCoordinates(destination);

            if (!pickUpCoordinates || !dropOffCoordinates) {
                throw new Error('Failed to fetch car rental coordinates');
            }

            const carRentalParams = {
                pickUpCoordinates,
                dropOffCoordinates,
                pickUpDate: fromDate,
                dropOffDate: toDate,
                pickUpTime: '10:00',
                dropOffTime: '10:00',
                currencyCode: 'CAD'
            };
            itinerary.carRentals = await searchCarRentals(carRentalParams);
        }

        if (services.includes('Restaurant')) {
            const locationId = await searchLocation(destination);
            if (!locationId) throw new Error(`Failed to fetch location ID for restaurants in ${destination}`);

            const restaurantData = await searchRestaurants(locationId);
            if (!restaurantData || restaurantData.length === 0) {
                throw new Error('No valid restaurants found');
            }
            itinerary.restaurants = restaurantData;
        }

        if (services.includes('Tour')) {
            const locationId = await searchTourLocation(destination);
            if (!locationId) throw new Error(`Failed to fetch location ID for tours in ${destination}`);
            
            const tourData = await searchAttractions(locationId);
            if (!tourData || tourData.length === 0) {
                throw new Error('No valid tour places found');
            }
            itinerary.tourPlaces = tourData;
        }

        if (budget && budgetPercentage) {
            itinerary = filterItineraryByBudget(itinerary, budget, budgetPercentage);
        }

        res.status(200).json(itinerary);
    } catch (error) {
        console.error('Error generating itinerary:', error.message);
        res.status(500).json({ error: 'Failed to generate itinerary', details: error.message });
    }
};

const filterItineraryByBudget = (itinerary, budget, budgetPercentage) => {
    const activeServices = Object.keys(itinerary).filter(key => itinerary[key]).length || 1;
    const budgetPerService = (budget * (budgetPercentage / 100)) / activeServices;
    console.log('Budget per service:', budgetPerService);

    if (itinerary.flights?.data?.flights && Array.isArray(itinerary.flights.data.flights)) {
        itinerary.flights.data.flights = itinerary.flights.data.flights.filter(flight => 
            flight.price?.totalAmount <= budgetPerService
        );
        console.log('Flights after budget filter:', itinerary.flights.data.flights.length);
    }

    if (Array.isArray(itinerary.hotels)) {
        console.log('Hotels before budget filter:', itinerary.hotels.length);
        itinerary.hotels = itinerary.hotels.filter(hotel => {
            const checkInDate = new Date(hotel.checkInDate);
            const checkOutDate = new Date(hotel.checkOutDate);
            const nights = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24); 
            const nightlyPrice = hotel.price / nights;
            console.log(`Hotel: ${hotel.name}, Total Price: ${hotel.price}, Nights: ${nights}, Nightly Price: ${nightlyPrice}`);
            return nightlyPrice <= budgetPerService;
        });
        console.log('Hotels after budget filter:', itinerary.hotels.length);
    }
    
    if (itinerary.carRentals?.data && Array.isArray(itinerary.carRentals.data)) {
        itinerary.carRentals.data = itinerary.carRentals.data.filter(carRental => 
            carRental.price?.amount <= budgetPerService
        );
    }

    if (itinerary.restaurants && Array.isArray(itinerary.restaurants)) {
        itinerary.restaurants = itinerary.restaurants.filter(restaurant => 
            restaurant.price?.amount === undefined || restaurant.price?.amount <= budgetPerService
        );
    }

    if (itinerary.tourPlaces && Array.isArray(itinerary.tourPlaces)) {
        itinerary.tourPlaces = itinerary.tourPlaces.filter(tour => 
            tour.price === 'N/A' ? true : (tour.price?.amount <= budgetPerService)
        );
    }

    return itinerary;
};