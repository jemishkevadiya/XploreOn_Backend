const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String },
    // sessionId: { type: String, unique: true },
    amount: { type: Number, required: true },
    // currency: { type: String, default: 'cad' },
    // service: { type: String, required: true },
    status: { type: String, required: true },
    // email: { type: String, required: true },

    // Firebase userId (String, not ObjectId)
    // userId: { type: String, required: true }, 

    // UUID-based bookingId (String, not ObjectId)
    bookingId: { type: String, required: true, ref: 'Booking' },

    // Optionally store charge details
    // paymentMethod: { type: String },
    chargeId: { type: String },
    // chargeStatus: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
