const mongoose = require('mongoose');

const SafetyAlertSchema = new mongoose.Schema({
  alertType: {
    type: String,
    enum: ['dark_street', 'harassment_spot', 'theft_risk', 'animal_threat', 'other'],
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
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['active', 'resolved', 'dismissed'], default: 'active' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SafetyAlert', SafetyAlertSchema);
