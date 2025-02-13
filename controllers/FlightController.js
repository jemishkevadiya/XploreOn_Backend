const { fetchFlightSearchResults, fetchAirportSuggestions } = require('../utils/api');
const User = require('../models/User')
const Booking = require(`../models/Booking`);
const {createCheckoutSession} = require('./PaymentController');
/**
 * Resolves the airport code for a given city
 * @param {string} city - City name to fetch airport suggestions
 * @returns {string|null} - The airport code or null if not found
 */
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


/**
 * Validates flight search parameters
 * @param {string} origin - Origin airport code or city name
 * @param {string} destination - Destination airport code or city name
 * @param {string} departureDate - Departure date (YYYY-MM-DD)
 * @param {string} returnDate - Return date (YYYY-MM-DD, optional)
 * @param {number} passengers - Number of passengers (must be at least 1)
 * @param {string} travelClass - Travel class (e.g., economy, business)
 * @param {string} tripType - Trip type (One Way or RoundTrip)
 * @returns {Object} Validation result with isValid and message
 */
const validateFlightSearch = (origin, destination, departureDate, returnDate, adults, children, travelClass, tripType, sort, pageNo) => {
  if (!origin || !destination || !departureDate || !adults || !travelClass || !tripType || !sort || !pageNo ) {
    return { isValid: false, message: 'Please fill in all required fields.' };
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    return { isValid: false, message: 'Origin and destination cannot be the same.' };
  }

  if (adults < 1) {
    return { isValid: false, message: 'At least one adult passenger is required.' };
  }

  if (children && !/^\d*(,\d+)*$/.test(children)) {
    return { isValid: false, message: 'Invalid children age format. Must be comma-separated numbers.' };
  }


  const isFutureDate = (date) => new Date(date).getTime() >= new Date().getTime();

  if (!isFutureDate(departureDate)) {
    return { isValid: false, message: 'Departure date must be today or in the future.' };
  }

  if (tripType.trim().toLowerCase() === 'roundtrip') {
    if (!returnDate || isNaN(new Date(returnDate))) {
      return { isValid: false, message: 'Return date is required for a round trip.' };
    }

    const depDate = new Date(departureDate).getTime();
    const retDate = new Date(returnDate).getTime();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (retDate < today.getTime()) {
      return { isValid: false, message: 'Return date must be today or in the future.' };
    }

    if (retDate <= depDate) {
      return { isValid: false, message: 'Return date must be after the departure date.' };
    }
  }

  return { isValid: true };
};

/**
 * Fetch flight search results based on user query
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFlightSearchResults = async (req, res) => {
  let { origin, destination, departureDate, returnDate, adults, children, travelClass, tripType, sort, pageNo } = req.query;

  try {
    const validationResult = validateFlightSearch(origin, destination, departureDate, returnDate, adults, children, travelClass, tripType, sort, pageNo);
    if (!validationResult.isValid) {
      return res.status(400).json({ message: validationResult.message });
    }

    if (!origin.includes('.')) {
      origin = await resolveAirportCode(origin);
      if (!origin) {
        return res.status(400).json({ message: `No valid airport found for city: ${req.query.origin || 'unknown city'}` });
      }
    }

    if (!destination.includes('.')) {
      destination = await resolveAirportCode(destination);
      if (!destination) {
        return res.status(400).json({ message: `No valid airport found for city: ${req.query.destination || 'unknown city'}` });
      }
    }

    const flightData = await fetchFlightSearchResults({
      fromId: origin,
      toId: destination,
      departureDate,
      returnDate: tripType.trim().toLowerCase() === 'roundtrip' ? returnDate : undefined,
      adults: Number(adults),
      children: children && children.length > 0 ? children : " ",
      cabinClass: travelClass.trim().toLowerCase(),
      sort,
      pageNo: pageNo
    });

    if (flightData.error) {
      return res.status(400).json({
        message: 'Invalid input for flight search.',
        error: flightData.error,
      });
    }

    if (!flightData || (Array.isArray(flightData) && flightData.length === 0)) {
      return res.status(404).json({ message: 'No flights found for the given criteria.' });
    }

    res.status(200).json(flightData);
  } catch (error) {
    console.error('Error in getFlightSearchResults:', error.message);
    res.status(500).json({
      message: 'Error fetching flight search results.',
      error: error.message,
    });
  }
};

/**
 * Fetch airport suggestions based on city name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAirportSuggestions = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required.' });
  }

  try {
    const suggestions = await fetchAirportSuggestions(query);
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error in getAirportSuggestions:', error.message);
    res.status(500).json({
      message: 'Failed to fetch airport suggestions.',
      error: error.message,
    });
  }
  
};

exports.createFlightBooking = async (req, res) => {
  try {
      // ** get the user id of the user from req.user.uid
      // ** const userId = req.user.uid;
      const { flightDetails, totalAmount, userId } = req.body;  // userId will be the Firebase `uid`
      // Check if the user exists using Firebase UID
      const user = await User.findOne({ uid: userId });  // Find user by Firebase `uid`
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Prepare the booking details
      const bookingDetails = {
          roundTrip: flightDetails.roundTrip,
          departureCity: flightDetails.departureCity,
          destinationCity: flightDetails.destinationCity,
          departureDate: flightDetails.departureDate,
          returnDate: flightDetails.returnDate,
          passengers: flightDetails.passengers,
          price: flightDetails.price
      };

      // Create a new booking record using `userId` (Firebase UID as a string)
      const newBooking = new Booking({
          userId: userId,  // Firebase UID as userId
          serviceType: 'flight',  // Indicating it's a flight booking
          bookingDetails: bookingDetails,
          totalAmount: totalAmount,
          paymentStatus: 'pending'  // Default to pending until payment is processed
      });


      // ** Save the booking into a variable -> Get the id, then call create payment session from payment controller
      // ** you have the booking id -> you have the amount 
      // ** you have the booking details
      // ** get the url from the checkout session and return that url
      // Save the booking to the database
      const booking = await newBooking.save();
      const paymentUrl = await createCheckoutSession(booking._id.toString(), totalAmount);
      console.log(paymentUrl);
      res.status(201).json({ message: 'Flight booking created successfully', paymentUrl: paymentUrl });
  } catch (error) {
      console.error('Error creating flight booking:', error);
      res.status(500).json({ message: 'Error creating flight booking', error: error.message });
  }
};