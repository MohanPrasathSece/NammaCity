const mongoose = require('mongoose');

const AccessibilityReportSchema = new mongoose.Schema({
  issueType: {
    type: String,
    enum: ['construction', 'roadblock', 'elevator_outage', 'ramp_blocked', 'other'],
    required: true
  },
  description: { type: String, maxlength: 500 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere',
    },
  },
  accessibility: {
    wheelchairFriendly: { type: Boolean, default: false },
    hasRamp: { type: Boolean, default: false },
    hasElevator: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AccessibilityReport', AccessibilityReportSchema);
