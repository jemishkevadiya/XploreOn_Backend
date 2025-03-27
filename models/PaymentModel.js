const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    bookingId: { type: String, required: true, ref: 'Booking' },
    chargeId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
