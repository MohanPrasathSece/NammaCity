const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  issueType: {
    type: String,
    required: [true, 'Please select an issue type'],
    enum: ['pothole', 'garbage', 'street-light', 'water-logging', 'other'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
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
  photoUrl: {
    type: String,
    required: [true, 'Please provide a photo of the issue'],
  },
  status: {
    type: String,
    enum: ['reported', 'verified', 'in_progress', 'resolved', 'rejected'],
    default: 'reported',
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  aiVerification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'unverified'],
      default: 'pending',
    },
    confidence: Number,
    model: String,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Issue', IssueSchema);
