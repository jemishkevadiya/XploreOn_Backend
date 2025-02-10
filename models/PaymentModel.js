const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentIntentId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'cad' },
  service: { type: String, required: true },   // e.g., "flight", "hotel booking", etc.
  status: { type: String, required: true },
  email: { type: String, required: true },   // Store user email
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
