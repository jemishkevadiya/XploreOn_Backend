const { fetchAirportSuggestions, fetchFlightSearchResults, fetchHotelData, fetchPickupCoordinates, 
    fetchDropOffCoordinates, searchTourLocation, searchRestaurants, searchAttractions, searchCarRentals, 
    searchLocation } = require('../utils/api');
const { retrieveDestinationCode } = require('../controllers/HotelController');

const carrierCodeToName = {
    "GE": "IndiGo",
    "AC": "Air Canada",
    "DL": "Delta Air Lines",
    "AA": "American Airlines",
    "UA": "United Airlines"
};

const resolveAirportCode = async (city) => {
    if (!city || typeof city !== 'string' || city.trim() === '') {
        return null;
    }
    try {
        const suggestions = await fetchAirportSuggestions(city);
        if (!suggestions || suggestions.length === 0) {
            return null;
        }
        const airport = suggestions.find(item => item.type === 'AIRPORT' && item.city.toLowerCase().includes(city.toLowerCase())) || 
                       suggestions.find(item => item.type === 'AIRPORT') || 
                       suggestions[0];
        if (!airport || !airport.code) {
            return null;
        }
        return `${airport.code}.AIRPORT`;
    } catch (error) {
        return null;
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
        childrenAges = ''
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
                    itinerary.hotels = null;
                } else {
                    const destinationCode = destinationData.destinationCode;
                    const childCount = childrenAges ? childrenAges.split(',').length : 0;
                    let data = await fetchHotelData(destinationCode, fromDate, toDate, adults, childCount);
                    if (data && data.data && data.data.hotels && data.data.hotels.length > 0) {
                        const checkInDate = new Date(fromDate);
                        const checkOutDate = new Date(toDate);
                        const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
                        itinerary.hotels = data.data.hotels.map(hotel => {
                            let totalPrice = hotel.property?.priceBreakdown?.grossPrice?.value || 
                                            hotel.price || 
                                            hotel.totalPrice || 
                                            0;
        
                            const roomNumber = hotel.property?.rooms?.[0]?.name || 
                                              hotel.roomName || 
                                              hotel.rooms?.[0]?.description || 
                                              hotel.rooms?.[0]?.type || 
                                              hotel.property?.roomType || 
                                              hotel.property?.room?.name || 
                                              hotel.room?.type || 
                                              'Standard Room';
                            return {
                                name: hotel.property?.name || hotel.name || 'Unnamed Hotel',
                                price: totalPrice, 
                                currency: hotel.property?.priceBreakdown?.grossPrice?.currency || 
                                         hotel.currency || 
                                         'CAD',
                                roomNumber: roomNumber,
                                reviewScore: hotel.property?.reviewScore || hotel.reviewScore || null,
                                checkInDate: hotel.property?.checkinDate || fromDate,
                                checkOutDate: hotel.property?.checkoutDate || toDate,
                                totalNights: totalNights 
                            };
                        });
                    } else {
                        itinerary.hotels = null;
                    }
                }
            } catch (error) {
                itinerary.hotels = null;
            }
        }

        if (services.includes('Car Rental')) {
            try {
                const pickUpCoordinates = await fetchPickupCoordinates(destination);
                const dropOffCoordinates = await fetchDropOffCoordinates(destination);   
                console.log('PickUp Coordinates:', pickUpCoordinates);
                console.log('DropOff Coordinates:', dropOffCoordinates);
                
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
                console.log('Car Rental API Response:', JSON.stringify(carRentalResponse, null, 2));
        
                if (!carRentalResponse || !carRentalResponse.data) {
                    itinerary.carRentals = null;
                    itinerary.messages.push('No car rentals available: Invalid response from car rental API.');
                } else {
                    itinerary.carRentals = carRentalResponse.data;
                }
            } catch (error) {
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
            itinerary.tourPlaces = tourData.map(tour => {
                const imageUrl = tour.imageUrl && tour.imageUrl !== 'https://via.placeholder.com/200' 
                    ? tour.imageUrl 
                    : 'https://via.placeholder.com/200'; 
                return {
                    name: tour.name,
                    description: tour.description || 'No description available',
                    images: [imageUrl], 
                };
            });
        }

        if (budget) {
            itinerary = filterItineraryByBudget(itinerary, budget, dietaryPreference, fromDate, toDate, adults, childrenAges);
        }

        res.status(200).json(itinerary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate itinerary', details: error.message });
    }
};

const filterItineraryByBudget = (itinerary, budget, dietaryPreference, fromDate, toDate, adults, childrenAges) => {
    const pricedServices = ['flights', 'hotels', 'restaurants'].filter(key => itinerary[key]);
    const activePricedServices = pricedServices.length || 1;
    const budgetPerService = budget / activePricedServices;

    if (Array.isArray(itinerary.flights) && itinerary.flights.length > 0) {
        const childCount = childrenAges ? childrenAges.split(',').length : 0;
        const totalPassengers = adults + childCount;

        const flightDetails = itinerary.flights.map(flight => {
            let totalPrice = flight.priceBreakdown?.total?.units + (flight.priceBreakdown?.total?.nanos || 0) / 1e9 || null;
            if (!totalPrice) {
                return null;
            }

            const segments = flight.segments || [];
            if (segments.length !== 2) {
                return null;
            }

            const outboundSegment = segments[0];
            const returnSegment = segments[1];
            const outboundLegs = outboundSegment.legs || [];
            const returnLegs = returnSegment.legs || [];

            if (outboundLegs.length === 0 || returnLegs.length === 0) {
                return null;
            }

            const outboundDepartureTime = outboundSegment.departure?.dateTime || 
                                          outboundSegment.departure?.at || 
                                          outboundLegs[0]?.departure?.dateTime || 
                                          outboundLegs[0]?.departure?.at || 
                                          outboundLegs[0]?.departureTime || 
                                          'Unknown';
            const outboundArrivalTime = outboundSegment.arrival?.dateTime || 
                                        outboundSegment.arrival?.at || 
                                        outboundLegs[outboundLegs.length - 1]?.arrival?.dateTime || 
                                        outboundLegs[outboundLegs.length - 1]?.arrival?.at || 
                                        outboundLegs[outboundLegs.length - 1]?.arrivalTime || 
                                        'Unknown';
            const returnDepartureTime = returnSegment.departure?.dateTime || 
                                        returnSegment.departure?.at || 
                                        returnLegs[0]?.departure?.dateTime || 
                                        returnLegs[0]?.departure?.at || 
                                        returnLegs[0]?.departureTime || 
                                        'Unknown';
            const returnArrivalTime = returnSegment.arrival?.dateTime || 
                                      returnSegment.arrival?.at || 
                                      returnLegs[returnLegs.length - 1]?.arrival?.dateTime || 
                                      returnLegs[returnLegs.length - 1]?.arrival?.at || 
                                      returnLegs[returnLegs.length - 1]?.arrivalTime || 
                                      'Unknown';

            return {
                price: totalPrice,
                currency: flight.priceBreakdown?.total?.currencyCode || 'CAD',
                outbound: {
                    airline: outboundLegs[0]?.carriersData?.[0]?.name || 
                             carrierCodeToName[outboundLegs[0]?.carrierCode] || 
                             'Unknown',
                    departureTime: outboundDepartureTime,
                    arrivalTime: outboundArrivalTime
                },
                return: {
                    airline: returnLegs[0]?.carriersData?.[0]?.name || 
                             carrierCodeToName[returnLegs[0]?.carrierCode] || 
                             'Unknown',
                    departureTime: returnDepartureTime,
                    arrivalTime: returnArrivalTime
                }
            };
        }).filter(detail => detail !== null);

        const sortedFlights = flightDetails.sort((a, b) => a.price - b.price);
        const affordableFlights = sortedFlights.filter(detail => detail.price <= budgetPerService);
        itinerary.flights = affordableFlights.length > 0 ? affordableFlights[0] : null;
    } else {
        itinerary.flights = null;
    }

    if (Array.isArray(itinerary.hotels) && itinerary.hotels.length > 0) {
        const sortedHotels = itinerary.hotels.sort((a, b) => a.price - b.price);
        const affordableHotels = sortedHotels.filter(hotel => hotel.price <= budgetPerService);
        itinerary.hotels = affordableHotels.length > 0 ? affordableHotels[0] : null;
    } else {
        itinerary.hotels = null;
    }

    if (Array.isArray(itinerary.restaurants) && itinerary.restaurants.length > 0) {
        let filteredRestaurants = itinerary.restaurants;
        if (dietaryPreference === 'vegetarian') {
            filteredRestaurants = filteredRestaurants.filter(r => r.isVegetarian === true || r.isVegetarian === undefined);
        } else if (dietaryPreference === 'non-vegetarian') {
            filteredRestaurants = filteredRestaurants.filter(r => !r.isVegetarian || r.isVegetarian === undefined);
        }
        const affordableRestaurants = filteredRestaurants
            .filter(r => !r.price?.amount || r.price.amount <= budgetPerService)
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 3);
        itinerary.restaurants = affordableRestaurants;
    } else {
        itinerary.restaurants = [];
    }

    if (itinerary.carRentals && itinerary.carRentals.content && Array.isArray(itinerary.carRentals.content.search_results)) {
        const carDetails = itinerary.carRentals.content.search_results.map(car => {
            let price = car.pricing_info?.base_price || car.pricing_info?.total_price || 0;
            let currency = car.pricing_info?.currency || car.pricing_info?.base_price_currency || 'INR';
    
            if (currency === 'INR' || price > 1000) {
                const exchangeRate = 0.01673;
                price = price * exchangeRate;
                price = Math.round(price * 100) / 100;
                currency = 'CAD';
            }
    
            const vehicle = car.vehicle_info?.name || car.vehicle_info?.v_name || 'Unknown Vehicle';
            const supplier = car.supplier_info?.name || 'Unknown Supplier';
    
            return {
                price,
                currency,
                vehicle,
                supplier
            };
        });
    
        const uniqueCarDetails = [];
        const seen = new Set();
        for (const car of carDetails) {
            const key = `${car.price}-${car.vehicle}-${car.supplier}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCarDetails.push(car);
            }
        }
    
        console.log('Unique Car Details:', uniqueCarDetails);
    
        uniqueCarDetails.sort((a, b) => a.price - b.price);
    
        // Calculate total people and cars needed
        const childCount = childrenAges ? childrenAges.split(',').length : 0;
        const totalPeople = adults + childCount;
        const carsNeeded = Math.ceil(totalPeople / 4); // 1 car per 4 people
        console.log(`Total People: ${totalPeople}, Cars Needed: ${carsNeeded}`);
    
        // Select the cheapest cars based on the number needed
        const selectedCars = uniqueCarDetails.slice(0, carsNeeded);
        console.log('Selected Cars:', selectedCars);
        itinerary.carRentals = selectedCars.length > 0 ? selectedCars : null;
    
        // Adjust total price for budget comparison
        if (selectedCars) {
            const totalCarPrice = selectedCars.reduce((sum, car) => sum + car.price, 0);
            console.log('Total Car Price:', totalCarPrice, 'Budget Per Service:', budgetPerService);
            if (totalCarPrice > budgetPerService) {
                itinerary.carRentals = null; // If total price exceeds budget, remove car rentals
            }
        }
    } else if (itinerary.carRentals && Array.isArray(itinerary.carRentals.search_results)) {
        const carDetails = itinerary.carRentals.search_results.map(car => {
            let price = car.pricing_info?.base_price || car.pricing_info?.total_price || 0;
            let currency = car.pricing_info?.currency || car.pricing_info?.base_price_currency || 'INR';
    
            if (currency === 'INR' || price > 1000) {
                const exchangeRate = 0.01673;
                price = price * exchangeRate;
                price = Math.round(price * 100) / 100;
                currency = 'CAD';
            }
    
            const vehicle = car.vehicle_info?.name || car.vehicle_info?.v_name || 'Unknown Vehicle';
            const supplier = car.supplier_info?.name || 'Unknown Supplier';
    
            return {
                price,
                currency,
                vehicle,
                supplier
            };
        });
    
        const uniqueCarDetails = [];
        const seen = new Set();
        for (const car of carDetails) {
            const key = `${car.price}-${car.vehicle}-${car.supplier}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCarDetails.push(car);
            }
        }
    
        console.log('Unique Car Details:', uniqueCarDetails);
    
        uniqueCarDetails.sort((a, b) => a.price - b.price);
    
        // Calculate total people and cars needed
        const childCount = childrenAges ? childrenAges.split(',').length : 0;
        const totalPeople = adults + childCount;
        const carsNeeded = Math.ceil(totalPeople / 4); // 1 car per 4 people
        console.log(`Total People: ${totalPeople}, Cars Needed: ${carsNeeded}`);
    
        // Select the cheapest cars based on the number needed
        const selectedCars = uniqueCarDetails.slice(0, carsNeeded);
        console.log('Selected Cars:', selectedCars);
        itinerary.carRentals = selectedCars.length > 0 ? selectedCars : null;
    
        // Adjust total price for budget comparison
        if (selectedCars) {
            const totalCarPrice = selectedCars.reduce((sum, car) => sum + car.price, 0);
            console.log('Total Car Price:', totalCarPrice, 'Budget Per Service:', budgetPerService);
            if (totalCarPrice > budgetPerService) {
                itinerary.carRentals = null; // If total price exceeds budget, remove car rentals
            }
        }
    } else {
        console.log('No valid car rental data structure found:', itinerary.carRentals);
        itinerary.carRentals = null;
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

    return itinerary;
};