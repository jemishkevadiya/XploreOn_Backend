const { fetchPickupCoordinates, fetchDropOffCoordinates, searchCarRentals } = require('../utils/api');
const User = require('../models/User');
const Booking = require('../models/Booking');
exports.searchCarRentalsWithCoordinates = async (req, res) => {
    const { pickupLocation, dropOffLocation, pickUpDate, dropOffDate, pickUpTime, dropOffTime, passengers, currencyCode } = req.query;

    try {
        if (!pickupLocation || !dropOffLocation || !pickUpDate || !dropOffDate || !pickUpTime || !dropOffTime) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const currentDate = new Date();
        const pickupDateObj = new Date(pickUpDate);
        const dropoffDateObj = new Date(dropOffDate);

        if (pickupDateObj <= currentDate) {
            return res.status(400).json({ message: 'Pick-up date must be in the future.' });
        }

        if (dropoffDateObj <= currentDate) {
            return res.status(400).json({ message: 'Drop-off date must be in the future.' });
        }

        if (dropoffDateObj <= pickupDateObj) {
            return res.status(400).json({ message: 'Drop-off date must be after the pick-up date.' });
        }

        const pickupCoordinates = await fetchPickupCoordinates(pickupLocation);
        if (!pickupCoordinates) {
            return res.status(400).json({ message: `Pickup location not found: ${pickupLocation}` });
        }

        const dropOffCoordinates = await fetchDropOffCoordinates(dropOffLocation);
        if (!dropOffCoordinates) {
            return res.status(400).json({ message: `Drop-off location not found: ${dropOffLocation}` });
        }

        const carRentals = await searchCarRentals({
            pickUpCoordinates: {
                latitude: pickupCoordinates.latitude,
                longitude: pickupCoordinates.longitude,
            },
            dropOffCoordinates: {
                latitude: dropOffCoordinates.latitude,
                longitude: dropOffCoordinates.longitude,
            },
            pickUpDate,
            dropOffDate,
            pickUpTime,
            dropOffTime,
            currencyCode,
        });

        if (!carRentals || carRentals.length === 0) {
            return res.status(404).json({ message: `No car rentals found for ${pickupLocation} to ${dropOffLocation} on ${pickUpDate} - ${dropOffDate}` });
        }

        res.status(200).json(carRentals);
        console.log(pickupCoordinates, dropOffCoordinates);
    } catch (error) {
        console.error('Error in searchCarRentalsWithCoordinates:', error.message);
        res.status(500).json({ message: 'Error fetching car rentals', error: error.message });
    }
};


exports.createCarRentalBooking = async (req, res) => {
    try {
        const { userId, rentalDetails, totalAmount } = req.body;

        const user = await User.findOne({ uid: userId });  
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const carRentalDetails = {
            carType: rentalDetails.carType,
            rentalStartDate: rentalDetails.rentalStartDate,
            rentalEndDate: rentalDetails.rentalEndDate,
            pickupLocation: rentalDetails.pickupLocation,
            dropOffLocation: rentalDetails.dropOffLocation,
            passengers: rentalDetails.passengers,
            price: rentalDetails.price
        };

        const newBooking = new Booking({
            userId: userId,  
            serviceType: 'car_rental',  
            bookingDetails: carRentalDetails,
            totalAmount: totalAmount,
            paymentStatus: 'pending'  
        });

        await newBooking.save();

        res.status(201).json({ message: 'Car rental booking created successfully', booking: newBooking });
    } catch (error) {
        console.error('Error creating car rental booking:', error);
        res.status(500).json({ message: 'Error creating car rental booking', error: error.message });
    }
};