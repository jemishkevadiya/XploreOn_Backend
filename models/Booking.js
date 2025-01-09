const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        default: 'paid'
    },
    itineraryPDFUrl: {
        type: String
    }
},{
    timestamps: true
})