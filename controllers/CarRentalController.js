const { fetchPickupCoordinates, fetchDropOffCoordinates, searchCarRentals } = require('../utils/api');

exports.getPickupCoordinates = async (req, res) => {
    const { pickupLocation } = req.query;

    try {
        const coordinates = await fetchPickupCoordinates(pickupLocation);
        if (coordinates) {
            res.status(200).json({ coordinates });
        } else {
            res.status(404).json({ message: `Location not found for: ${pickupLocation}` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pickup coordinates', error: error.message });
    }
};

exports.getDropOffCoordinates = async (req, res) => {
    const { dropOffLocation } = req.query;

    try {
        const coordinates = await fetchDropOffCoordinates(dropOffLocation);
        if (coordinates) {
            res.status(200).json({ coordinates });
        } else {
            res.status(404).json({ message: `Location not found for: ${dropOffLocation}` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching drop-off coordinates', error: error.message });
    }
};

exports.searchCarRentals = async (req, res) => {
    const { pickUpLatitude, pickUpLongitude, dropOffLatitude, dropOffLongitude, pickUpDate, dropOffDate, pickUpTime, dropOffTime, currencyCode } = req.query;

    try {
        const carRentals = await searchCarRentals({
            pickUpCoordinates: { latitude: pickUpLatitude, longitude: pickUpLongitude },
            dropOffCoordinates: { latitude: dropOffLatitude, longitude: dropOffLongitude },
            pickUpDate,
            dropOffDate,
            pickUpTime,
            dropOffTime,
            currencyCode,
        });

        res.status(200).json(carRentals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching car rentals', error: error.message });
    }
};
