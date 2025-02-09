const { fetchDestinationCode, fetchHotelData, fetchRoomAvailability, fetchHotelDetails,fetchHotelPhotos, fetchHotelFacilities, fetchHotelFilters,fetchSortOptions } = require('../utils/api');

const isValidDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; 
    return dateRegex.test(date) && !isNaN(new Date(date).getTime());
};

const isFutureDate = (date) => {
    const today = new Date();
    const inputDate = new Date(date);
    today.setHours(0, 0, 0, 0); 
    return inputDate > today;
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

const getDestinationCode = async (req, res) => {
    try {
        const { location } = req.query;

        if (!location || typeof location !== 'string' || location.trim() === '') {
            return res.status(400).json({ error: 'Valid location is required' });
        }

        const data = await retrieveDestinationCode(location.trim());

        if (!res.headersSent) {
            res.status(200).json(data);
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
};


const getHotelData = async (req, res) => {
    const { location, checkIn, checkOut, person, roomQty, sortBy, sortOrder, amenities } = req.query;

    if (!location || typeof location !== 'string' || location.trim() === '') {
        return res.status(400).json({ error: 'Valid location is required' });
    }
    if (!checkIn || !isValidDate(checkIn)) {
        return res.status(400).json({ error: 'Valid checkIn date (YYYY-MM-DD) is required' });
    }
    if (!checkOut || !isValidDate(checkOut)) {
        return res.status(400).json({ error: 'Valid checkOut date (YYYY-MM-DD) is required' });
    }
    if (!isFutureDate(checkIn)) {
        return res.status(400).json({ error: 'checkIn date must be in the future' });
    }
    if (!isFutureDate(checkOut)) {
        return res.status(400).json({ error: 'checkOut date must be in the future' });
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
        return res.status(400).json({ error: 'checkOut date must be after checkIn date' });
    }
    if (!person || isNaN(person) || person <= 0) {
        return res.status(400).json({ error: 'Valid person count greater than 0 is required' });
    }
    if (roomQty && (isNaN(roomQty) || roomQty <= 0)) {
        return res.status(400).json({ error: 'Valid room quantity greater than 0 is required' });
    }

    try {
        const trimmedLocation = location.trim();

        const destinationData = await retrieveDestinationCode(trimmedLocation);
        if (!destinationData || !destinationData.destinationCode) {
            return res.status(404).json({ error: `No destination code found for location: ${trimmedLocation}` });
        }

        const destinationCode = destinationData.destinationCode;

        let data = await fetchHotelData(
            destinationCode,
            checkIn,
            checkOut,
            parseInt(person, 10),
            parseInt(roomQty, 10) || 1  
        );

        if (!Array.isArray(data)) {
            if (data.data && Array.isArray(data.data.hotels)) {
                data = data.data.hotels;
            } else {
                throw new Error('Expected hotel data array not found.');
            }
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRoomAvailability = async (req, res) => {
    const { hotelId, checkIn, checkOut } = req.query;

    if (!hotelId) {
        return res.status(400).json({ error: 'Hotel ID is required' });
    }
    if (!checkIn || !checkOut) {
        return res.status(400).json({ error: 'Check-in and check-out dates are required' });
    }

    try {
        const data = await fetchRoomAvailability(hotelId, checkIn, checkOut);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHotelDetails = async (req, res) => {
    const { hotelId, arrivalDate, departureDate } = req.query;

    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim() === '') {
        return res.status(400).json({ error: 'Valid hotel ID is required' });
    }
    if (!arrivalDate || !isValidDate(arrivalDate)) {
        return res.status(400).json({ error: 'Valid arrival date (YYYY-MM-DD) is required' });
    }
    if (!departureDate || !isValidDate(departureDate)) {
        return res.status(400).json({ error: 'Valid departure date (YYYY-MM-DD) is required' });
    }
    if (!isFutureDate(arrivalDate)) {
        return res.status(400).json({ error: 'Arrival date must be in the future' });
    }
    if (!isFutureDate(departureDate)) {
        return res.status(400).json({ error: 'Departure date must be in the future' });
    }
    if (new Date(departureDate) <= new Date(arrivalDate)) {
        return res.status(400).json({ error: 'Departure date must be after arrival date' });
    }

    try {
        const data = await fetchHotelDetails(hotelId.trim(), arrivalDate, departureDate);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHotelPhotos = async (req, res) => {
    const { hotelId } = req.query;

    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim() === '') {
        return res.status(400).json({ error: 'Valid hotel ID is required' });
    }

    try {
        const data = await fetchHotelPhotos(hotelId.trim());
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHotelFacilities = async (req, res) => {
    const { hotelId } = req.query;

    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim() === '') {
        return res.status(400).json({ error: 'Valid hotel ID is required' });
    }

    try {
        const data = await fetchHotelFacilities(hotelId.trim());
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getHotelFilters = async (req, res) => {
    const { location, checkIn, checkOut, adults, roomQty } = req.query;

    if (!location || typeof location !== 'string' || location.trim() === '') {
        return res.status(400).json({ error: 'Valid location is required' });
    }
    if (!checkIn || !isValidDate(checkIn)) {
        return res.status(400).json({ error: 'Valid check-in date (YYYY-MM-DD) is required' });
    }
    if (!checkOut || !isValidDate(checkOut)) {
        return res.status(400).json({ error: 'Valid check-out date (YYYY-MM-DD) is required' });
    }
    if (!isFutureDate(checkIn)) {
        return res.status(400).json({ error: 'checkIn date must be in the future' });
    }
    if (!isFutureDate(checkOut)) {
        return res.status(400).json({ error: 'checkOut date must be in the future' });
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    try {
        const trimmedLocation = location.trim();
        const destinationData = await retrieveDestinationCode(trimmedLocation);

        if (!destinationData || !destinationData.destinationCode) {
            return res.status(404).json({ error: `No destination code found for location: ${trimmedLocation}` });
        }

        const destinationCode = destinationData.destinationCode;
        const searchType = 'CITY'; 

        const data = await fetchHotelFilters(
            destinationCode,
            searchType,
            checkIn,
            checkOut,
            parseInt(adults, 10) || 1,
            parseInt(roomQty, 10) || 1
        );

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getSortOptions = async (req, res) => {
    const { location, checkIn, checkOut, adults, roomQty } = req.query;

    if (!location || typeof location !== 'string' || location.trim() === '') {
        return res.status(400).json({ error: 'Valid location is required' });
    }
    if (!checkIn || !isValidDate(checkIn)) {
        return res.status(400).json({ error: 'Valid check-in date (YYYY-MM-DD) is required' });
    }
    if (!checkOut || !isValidDate(checkOut)) {
        return res.status(400).json({ error: 'Valid check-out date (YYYY-MM-DD) is required' });
    }
    if (!isFutureDate(checkIn)) {
        return res.status(400).json({ error: 'Check-in date must be in the future' });
    }
    if (!isFutureDate(checkOut)) {
        return res.status(400).json({ error: 'Check-out date must be in the future' });
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }


    try {
        const trimmedLocation = location.trim();
        const destinationData = await retrieveDestinationCode(trimmedLocation);

        if (!destinationData || !destinationData.destinationCode) {
            return res.status(404).json({ error: `No destination code found for location: ${trimmedLocation}` });
        }

        const destinationCode = destinationData.destinationCode;
        const sortOptions = await fetchSortOptions(destinationCode, "CITY", checkIn, checkOut, parseInt(adults, 10) || 1 , parseInt(roomQty, 10) || 1);

        res.status(200).json(sortOptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

 

module.exports = {
    getDestinationCode,
    getHotelData,
    getRoomAvailability,
    getHotelDetails,
    getHotelPhotos,
    getHotelFacilities,
    getHotelFilters,
    getSortOptions,
};

