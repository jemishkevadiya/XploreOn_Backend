const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { 
        type: String,  // Store Firebase UID as a string
        required: true
    },
    serviceType: {
        type: String,
        enum: ['flight', 'car_rental', 'hotel', 'itinerary'],
        required: true
    },
    bookingDetails: {
        type: Object,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    itineraryPDFUrl: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
