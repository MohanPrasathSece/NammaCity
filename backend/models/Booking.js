const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['reservation', 'appointment', 'order', 'inquiry'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  partySize: {
    type: Number,
    default: 1
  },
  specialRequests: {
    type: String,
    maxlength: 300
  },
  contactInfo: {
    phone: String,
    email: String,
    alternatePhone: String
  },
  pricing: {
    baseAmount: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'bank_transfer']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['user', 'service', 'system']
    },
    cancelledAt: Date,
    refundAmount: Number
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ service: 1, scheduledDate: 1 });
bookingSchema.index({ status: 1 });

// Virtual for booking reference
bookingSchema.virtual('bookingRef').get(function() {
  return `NC${this._id.toString().slice(-8).toUpperCase()}`;
});

module.exports = mongoose.model('Booking', bookingSchema);
