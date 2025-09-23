const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['restaurant', 'hotel', 'utility', 'education', 'healthcare', 'transport', 'entertainment', 'shopping']
  },
  subcategory: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      default: 'Coimbatore'
    },
    state: {
      type: String,
      default: 'Tamil Nadu'
    },
    pincode: {
      type: String,
      required: true
    }
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    website: {
      type: String
    }
  },
  timings: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  amenities: [String],
  priceRange: {
    type: String,
    enum: ['₹', '₹₹', '₹₹₹', '₹₹₹₹']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  metadata: {
    views: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
serviceSchema.index({ "location": "2dsphere" });
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ "rating.average": -1 });
serviceSchema.index({ tags: 1 });

// Virtual for full address
serviceSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} - ${this.location.pincode}`;
});

// Method to check if service is open now
serviceSchema.methods.isOpenNow = function() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayTiming = this.timings[day];
  if (todayTiming.closed) return false;
  
  return currentTime >= todayTiming.open && currentTime <= todayTiming.close;
};

module.exports = mongoose.model('Service', serviceSchema);
