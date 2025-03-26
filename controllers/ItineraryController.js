const { fetchAirportSuggestions, fetchFlightSearchResults, fetchDestinationCode, fetchHotelData, fetchPickupCoordinates, 
    fetchDropOffCoordinates, searchTourLocation, searchRestaurants, searchAttractions, searchCarRentals, 
    searchLocation } = require('../utils/api');

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
        console.error('[resolveAirportCode] Error:', error.message);
        return null;
    }
};

const normalizeLocation = (location) => {
    return location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
};

const retrieveDestinationCode = async (location) => {
    try {
        const normalizedLocation = normalizeLocation(location.trim());

        const response = await fetchDestinationCode(normalizedLocation);

        if (response && response.data && response.data.length > 0) {
            const primaryDestination = response.data[0];
            return {
                destinationCode: primaryDestination.dest_id,
                name: primaryDestination.name,
                region: primaryDestination.region,
                country: primaryDestination.country,
            };
        } else {
            throw new Error(`No destination code found for location: ${normalizedLocation}`);
        }
    } catch (error) {
        throw error;
    }
};

exports.generateItinerary = async (req, res) => {
    const { 
        origin, 
        destination, 
        fromDate, 
        toDate, 
        services, 
        budget, 
        dietaryPreference, 
        adults = 1, 
        childrenAges = '',
        preference = 'cheap'
    } = req.body;

    if (!origin || !destination || !fromDate || !toDate || !services || !Array.isArray(services)) {
        return res.status(400).json({ 
            error: 'Missing or invalid required fields', 
            details: 'origin, destination, fromDate, toDate, and services (array) are required' 
        });
    }
    if (services.includes('Restaurant')) {
        const validPreferences = ['vegetarian', 'non-vegetarian'];
        const normalizedPreference = dietaryPreference?.toLowerCase();
        if (!normalizedPreference || !validPreferences.includes(normalizedPreference)) {
            return res.status(400).json({ 
                error: 'Missing or invalid dietaryPreference', 
                details: 'dietaryPreference must be "vegetarian" or "non-vegetarian" for restaurants' 
            });
        }
    }
    if (!Number.isInteger(adults) || adults < 1) {
        return res.status(400).json({ 
            error: 'Invalid adults', 
            details: 'adults must be an integer >= 1' 
        });
    }
    if (typeof childrenAges !== 'string' || (childrenAges && !/^\d*(,\d+)*$/.test(childrenAges))) {
        return res.status(400).json({ 
            error: 'Invalid childrenAges', 
            details: 'childrenAges must be a string of comma-separated integers (e.g., "5" or "5,7")' 
        });
    }
    if (childrenAges) {
        const ages = childrenAges.split(',').map(Number);
        if (ages.some(age => age < 0 || age > 17)) {
            return res.status(400).json({ 
                error: 'Invalid childrenAges values', 
                details: 'All ages in childrenAges must be between 0 and 17' 
            });
        }
    }
    if (!['cheap', 'best'].includes(preference)) {
        return res.status(400).json({ 
            error: 'Invalid preference', 
            details: 'preference must be "cheap" or "best"' 
        });
    }

    let itinerary = {
        flights: null,
        hotels: null,
        carRentals: null,
        restaurants: [],
        tourPlaces: [],
        messages: []
    };

    try {
        if (services.includes('Flight')) {
            let originCode = origin.includes('.') ? origin : await resolveAirportCode(origin);
            if (!originCode) throw new Error(`Failed to resolve airport code for origin: ${origin}`);
            let destCode = destination.includes('.') ? destination : await resolveAirportCode(destination);
            if (!destCode) throw new Error(`Failed to resolve airport code for destination: ${destination}`);
            const flightParams = {
                fromId: originCode,
                toId: destCode,
                departureDate: fromDate,
                returnDate: toDate,
                adults,
                cabinClass: 'economy',
                pageNo: 1,
                currencyCode: 'CAD'
            };
            const flightResponse = await fetchFlightSearchResults(flightParams);
            itinerary.flights = flightResponse?.data?.flightOffers || null;
        }

        if (services.includes('Hotel')) {
            try {
                const destinationData = await retrieveDestinationCode(destination);
                if (!destinationData || !destinationData.destinationCode) {
                    itinerary.messages.push(`No destination code found for ${destination}`);
                    itinerary.hotels = null;
                } else {
                    const destinationCode = destinationData.destinationCode;
                    const childCount = childrenAges ? childrenAges.split(',').length : 0;
                    console.log(`[Hotel] Fetching hotel data with code: ${destinationCode}, from: ${fromDate}, to: ${toDate}, adults: ${adults}, children: ${childCount}`);
                    const hotelData = await fetchHotelData(destinationCode, fromDate, toDate, adults, childCount);
                    if (hotelData) {
                        itinerary.hotels = hotelData.data?.hotels || hotelData.hotels || hotelData || null;
                        console.log(`[Hotel] Extracted Hotel Data:`, JSON.stringify(itinerary.hotels, null, 2));
                    } else {
                        itinerary.hotels = null;
                        console.log(`[Hotel] No hotel data returned`);
                    }
                }
            } catch (error) {
                console.error(`[Hotel] Error fetching hotels:`, error.stack);
                itinerary.messages.push(`Hotel fetch error: ${error.message}`);
                itinerary.hotels = null;
            }
        }

        if (services.includes('Car Rental')) {
            try {
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
        
                const carRentalResponse = await searchCarRentals(carRentalParams);
                itinerary.carRentals = carRentalResponse?.data || null;
            } catch (error) {
                console.error('[Car] Error fetching car rentals:', error.message);
                itinerary.carRentals = null;
                itinerary.messages.push('Error fetching car rentals: ' + error.message);
            }
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

        if (budget) {
            itinerary = filterItineraryByBudget(itinerary, budget, dietaryPreference, fromDate, toDate, adults, childrenAges, preference);
        }

        res.status(200).json(itinerary);
    } catch (error) {
        console.error('[Itinerary] Global error:', error.message);
        res.status(500).json({ error: 'Failed to generate itinerary', details: error.message });
    }
};

const filterItineraryByBudget = (itinerary, budget, dietaryPreference, fromDate, toDate, adults, childrenAges, preference) => {
    let remainingBudget = budget;

    if (Array.isArray(itinerary.flights) && itinerary.flights.length > 0) {
        const childCount = childrenAges ? childrenAges.split(',').length : 0;
        const totalPassengers = adults + childCount;

        const flightDetails = itinerary.flights.map(flight => {
            let totalPrice = flight.priceBreakdown?.total?.units + (flight.priceBreakdown?.total?.nanos || 0) / 1e9 || null;
            if (!totalPrice) return null;

            const segments = flight.segments || [];
            if (segments.length !== 2) return null;

            const outboundSegment = segments[0];
            const returnSegment = segments[1];
            const outboundLegs = outboundSegment.legs || [];
            const returnLegs = returnSegment.legs || [];

            if (outboundLegs.length === 0 || returnLegs.length === 0) return null;

            return {
                price: totalPrice,
                currency: flight.priceBreakdown?.total?.currencyCode || 'CAD',
                outbound: {
                    airline: outboundLegs[0]?.carriersData?.[0]?.name || (outboundLegs[0]?.carrierCode ? carrierCodeToName[outboundLegs[0].carrierCode] : 'Unknown'),
                    departureTime: outboundSegment.departure?.dateTime || outboundSegment.departure?.at || outboundLegs[0]?.departure?.dateTime || outboundLegs[0]?.departure?.at || outboundLegs[0]?.departureTime || 'Unknown',
                    arrivalTime: outboundSegment.arrival?.dateTime || outboundSegment.arrival?.at || outboundLegs[outboundLegs.length - 1]?.arrival?.dateTime || outboundLegs[outboundLegs.length - 1]?.arrival?.at || outboundLegs[outboundLegs.length - 1]?.arrivalTime || 'Unknown'
                },
                return: {
                    airline: returnLegs[0]?.carriersData?.[0]?.name || (returnLegs[0]?.carrierCode ? carrierCodeToName[returnLegs[0].carrierCode] : 'Unknown'),
                    departureTime: returnSegment.departure?.dateTime || returnSegment.departure?.at || returnLegs[0]?.departure?.dateTime || returnLegs[0]?.departure?.at || returnLegs[0]?.departureTime || 'Unknown',
                    arrivalTime: returnSegment.arrival?.dateTime || returnSegment.arrival?.at || returnLegs[returnLegs.length - 1]?.arrival?.dateTime || returnLegs[returnLegs.length - 1]?.arrival?.at || returnLegs[returnLegs.length - 1]?.arrivalTime || 'Unknown'
                }
            };
        }).filter(detail => detail !== null && detail.price <= remainingBudget);

        if (flightDetails.length > 0) {
            const selectedFlight = preference === 'cheap'
                ? flightDetails.sort((a, b) => a.price - b.price)[0]
                : flightDetails.sort((a, b) => b.price - a.price)[0];
            itinerary.flights = selectedFlight;
            remainingBudget -= selectedFlight.price;
        } else {
            itinerary.flights = null;
            console.log(`[Budget] No affordable flights`);
        }
    } else {
        itinerary.flights = null;
    }

    if (Array.isArray(itinerary.hotels) && itinerary.hotels.length > 0) {
        const hotelDetails = itinerary.hotels.map(hotel => {
            let totalPrice = hotel.property?.priceBreakdown?.grossPrice?.value || 
                            hotel.price || 
                            hotel.totalPrice || 
                            0;
            return {
                name: hotel.property?.name || hotel.name || 'Unnamed Hotel',
                price: totalPrice, 
                currency: hotel.property?.priceBreakdown?.grossPrice?.currency || 
                         hotel.currency || 
                         'CAD',
                reviewScore: hotel.property?.reviewScore || hotel.reviewScore || 0,
                checkInDate: hotel.property?.checkinDate || fromDate,
                checkOutDate: hotel.property?.checkoutDate || toDate,
                totalNights: Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24))
            };
        }).filter(hotel => hotel.price <= remainingBudget);

        console.log(`[Budget] Mapped Hotels:`, JSON.stringify(hotelDetails, null, 2));
        if (hotelDetails.length > 0) {
            const selectedHotel = preference === 'cheap'
                ? hotelDetails.sort((a, b) => a.price - b.price)[0]
                : hotelDetails.sort((a, b) => (b.reviewScore || 0) - (a.reviewScore || 0))[0];
            itinerary.hotels = selectedHotel;
            remainingBudget -= selectedHotel.price;
        } else {
            itinerary.hotels = null;
            console.log(`[Budget] No affordable hotels`);
        }
    } else {
        itinerary.hotels = null;
        console.log(`[Budget] No hotels to process`);
    }

    if (itinerary.carRentals) {
        const searchResults = itinerary.carRentals.content?.search_results || itinerary.carRentals.search_results || [];
        if (Array.isArray(searchResults)) {
            const carDetails = searchResults.map(car => {
                let price = car.pricing_info?.base_price || car.pricing_info?.total_price || 0;
                let currency = car.pricing_info?.currency || car.pricing_info?.base_price_currency || 'INR';
                if (currency === 'INR' || price > 1000) {
                    const exchangeRate = 0.01673;
                    price = price * exchangeRate;
                    price = Math.round(price * 100) / 100;
                    currency = 'CAD';
                }
                return {
                    price,
                    currency,
                    vehicle: car.vehicle_info?.name || car.vehicle_info?.v_name || 'Unknown Vehicle',
                    supplier: car.supplier_info?.name || 'Unknown Supplier'
                };
            });

            const uniqueCarDetails = [...new Set(carDetails.map(car => `${car.price}-${car.vehicle}-${car.supplier}`))]
                .map(key => carDetails.find(car => `${car.price}-${car.vehicle}-${car.supplier}` === key))
                .filter(car => car.price <= remainingBudget);

            if (uniqueCarDetails.length > 0) {
                const childCount = childrenAges ? childrenAges.split(',').length : 0;
                const totalPeople = adults + childCount;
                const carsNeeded = Math.ceil(totalPeople / 4);

                const sortedCars = preference === 'cheap'
                    ? uniqueCarDetails.sort((a, b) => a.price - b.price)
                    : uniqueCarDetails.sort((a, b) => b.price - a.price);

                const selectedCars = [];
                let totalCarCost = 0;
                for (let i = 0; i < carsNeeded && i < sortedCars.length; i++) {
                    if (totalCarCost + sortedCars[i].price <= remainingBudget) {
                        selectedCars.push(sortedCars[i]);
                        totalCarCost += sortedCars[i].price;
                    } else {
                        break;
                    }
                }

                if (selectedCars.length > 0) {
                    itinerary.carRentals = selectedCars;
                    remainingBudget -= totalCarCost;
                } else {
                    itinerary.carRentals = null;
                    console.log(`[Budget] No affordable cars`);
                }
            } else {
                itinerary.carRentals = null;
                console.log(`[Budget] No affordable cars after filtering`);
            }
        } else {
            itinerary.carRentals = null;
            console.log(`[Budget] No car rental data to filter`);
        }
    } else {
        itinerary.carRentals = null;
    }

    if (Array.isArray(itinerary.restaurants) && itinerary.restaurants.length > 0) {
        let filteredRestaurants = itinerary.restaurants;
        if (dietaryPreference === 'vegetarian') {
            filteredRestaurants = filteredRestaurants.filter(r => r.isVegetarian === true || r.isVegetarian === undefined);
        } else if (dietaryPreference === 'non-vegetarian') {
            filteredRestaurants = filteredRestaurants.filter(r => !r.isVegetarian || r.isVegetarian === undefined);
        }

        const affordableRestaurants = filteredRestaurants
            .filter(r => !r.price?.amount || r.price.amount <= remainingBudget / 3)
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 3);

        if (affordableRestaurants.length > 0) {
            const totalRestaurantCost = affordableRestaurants.reduce((sum, r) => sum + (r.price?.amount || 0), 0);
            itinerary.restaurants = affordableRestaurants;
            remainingBudget -= totalRestaurantCost;
        } else {
            itinerary.restaurants = [];
            console.log(`[Budget] No affordable restaurants`);
        }
    } else {
        itinerary.restaurants = [];
    }

    if (Array.isArray(itinerary.tourPlaces) && itinerary.tourPlaces.length > 0) {
        const days = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24));
        const toursPerDay = 3;
        const segmentedTours = {};
        for (let i = 0; i < days && i * toursPerDay < itinerary.tourPlaces.length; i++) {
            segmentedTours[`Day ${i + 1}`] = itinerary.tourPlaces.slice(i * toursPerDay, (i + 1) * toursPerDay);
        }
        itinerary.tourPlaces = segmentedTours;
    } else {
        itinerary.tourPlaces = [];
    }

    itinerary.messages.push(`Remaining budget: $${remainingBudget.toFixed(2)}`);
    return itinerary;
};