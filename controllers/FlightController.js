const { fetchFlightSearchResults, fetchAirportSuggestions } = require('../utils/api');
const User = require('../models/User')
const Booking = require(`../models/Booking`);
const {createCheckoutSession} = require('./PaymentController');

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
      const { flightDetails, totalAmount, userId } = req.body; 
      const user = await User.findOne({ uid: userId }); 
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const bookingDetails = {
          departureCity: flightDetails.departureCity,
          destinationCity: flightDetails.destinationCity,
          departureDate: flightDetails.departureDate,
          returnDate: flightDetails.returnDate,
          passengers: flightDetails.passengers,
      };

      const newBooking = new Booking({
          userId: userId,  
          serviceType: 'flight',  
          bookingDetails: bookingDetails,
          totalAmount: totalAmount,
          paymentStatus: 'pending'  
      });

      const booking = await newBooking.save();
      const paymentUrl = await createCheckoutSession(booking._id.toString(), totalAmount);
      console.log(paymentUrl);
      res.status(201).json({ message: 'Flight booking created successfully', paymentUrl: paymentUrl });
  } catch (error) {
      console.error('Error creating flight booking:', error);
      res.status(500).json({ message: 'Error creating flight booking', error: error.message });
  }
};