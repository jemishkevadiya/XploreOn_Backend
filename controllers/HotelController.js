const { fetchDestinationCode, fetchHotelData } = require('../utils/api');

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
    const { location } = req.query;

    if (!location || typeof location !== 'string' || location.trim() === '') {
        return res.status(400).json({ error: 'Valid location is required' });
    }

    try {
        const trimmedLocation = location.trim();
        const data = await retrieveDestinationCode(trimmedLocation);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHotelData = async (req, res) => {
    const { location, checkIn, checkOut, person, sortBy, sortOrder, amenities } = req.query;

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
    if (new Date(checkOut) <= new Date(checkIn)) {
        return res.status(400).json({ error: 'checkOut date must be after checkIn date' });
    }
    if (!person || isNaN(person) || person <= 0) {
        return res.status(400).json({ error: 'Valid person count greater than 0 is required' });
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
            parseInt(person, 10)
        );

        if (!Array.isArray(data)) {
            if (data.data && Array.isArray(data.data.hotels)) {
                data = data.data.hotels;
            } else {
                throw new Error('Expected hotel data array not found.');
            }
        }

        const amenitiesList = amenities ? amenities.split(',').map((a) => a.trim()) : [];


        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDestinationCode,
    getHotelData,
};
