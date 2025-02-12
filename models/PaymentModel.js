const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String, required: true, unique: true },
    sessionId: { type: String, unique: true }, 
    amount: { type: Number, required: true },
    currency: { type: String, default: 'cad' },
    service: { type: String, required: true }, 
    status: { type: String, required: true },
    email: { type: String, required: true }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentMethod: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
