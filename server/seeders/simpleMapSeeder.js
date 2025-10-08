const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mohanprasath563:0110@cluster0.pvcyzuc.mongodb.net/urbanaid?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected for seeding: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Simple Urban Aid Map Data for Coimbatore
const mapData = [
  {
    name: 'Annapoorna Community Kitchen',
    description: 'Free meals available from 12 PM to 2 PM daily. Serves traditional South Indian meals.',
    category: 'restaurant',
    subcategory: 'Free Food',
    location: {
      type: 'Point',
      coordinates: [76.9558, 11.0168],
      address: 'RS Puram',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641002'
    },
    contact: {
      phone: '+91 9876543210'
    },
    timings: {
      monday: { open: '12:00', close: '14:00', closed: false },
      tuesday: { open: '12:00', close: '14:00', closed: false },
      wednesday: { open: '12:00', close: '14:00', closed: false },
      thursday: { open: '12:00', close: '14:00', closed: false },
      friday: { open: '12:00', close: '14:00', closed: false },
      saturday: { open: '12:00', close: '14:00', closed: false },
      sunday: { open: '12:00', close: '14:00', closed: false }
    },
    amenities: ['Free Meals', 'Clean Water', 'Seating Area'],
    priceRange: '₹',
    tags: ['free', 'food', 'community'],
    isActive: true
  },
  {
    name: 'Municipal Night Shelter',
    description: 'Safe overnight accommodation with basic facilities. Registration required.',
    category: 'utility',
    subcategory: 'Night Shelter',
    location: {
      type: 'Point',
      coordinates: [76.9520, 11.0180],
      address: 'Town Hall Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    contact: {
      phone: '+91 9876543212'
    },
    timings: {
      monday: { open: '19:00', close: '06:00', closed: false },
      tuesday: { open: '19:00', close: '06:00', closed: false },
      wednesday: { open: '19:00', close: '06:00', closed: false },
      thursday: { open: '19:00', close: '06:00', closed: false },
      friday: { open: '19:00', close: '06:00', closed: false },
      saturday: { open: '19:00', close: '06:00', closed: false },
      sunday: { open: '19:00', close: '06:00', closed: false }
    },
    amenities: ['Beds', 'Blankets', 'Security', 'Basic Toilets'],
    tags: ['shelter', 'night', 'accommodation'],
    isActive: true
  },
  {
    name: 'District Central Library Study Hall',
    description: 'Quiet study space with free WiFi and reading materials. AC facility available.',
    category: 'education',
    subcategory: 'Study Zone',
    location: {
      type: 'Point',
      coordinates: [76.9500, 11.0150],
      address: 'Town Hall',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    contact: {
      phone: '+91 9876543214'
    },
    timings: {
      monday: { open: '09:00', close: '20:00', closed: false },
      tuesday: { open: '09:00', close: '20:00', closed: false },
      wednesday: { open: '09:00', close: '20:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    },
    amenities: ['Free WiFi', 'AC', 'Reading Materials', 'Silent Zone'],
    tags: ['study', 'library', 'wifi', 'quiet'],
    isActive: true
  },
  {
    name: 'Cross Cut Road Public Toilet',
    description: 'Clean public restroom facility maintained by the corporation.',
    category: 'utility',
    subcategory: 'Public Restroom',
    location: {
      type: 'Point',
      coordinates: [76.9580, 11.0180],
      address: 'Cross Cut Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    contact: {
      phone: '+91 9876543215'
    },
    timings: {
      monday: { open: '05:00', close: '22:00', closed: false },
      tuesday: { open: '05:00', close: '22:00', closed: false },
      wednesday: { open: '05:00', close: '22:00', closed: false },
      thursday: { open: '05:00', close: '22:00', closed: false },
      friday: { open: '05:00', close: '22:00', closed: false },
      saturday: { open: '05:00', close: '22:00', closed: false },
      sunday: { open: '05:00', close: '22:00', closed: false }
    },
    amenities: ['Clean Toilets', 'Water Supply', 'Lighting'],
    tags: ['restroom', 'public', 'clean'],
    isActive: true
  },
  {
    name: 'Government General Hospital',
    description: 'Primary healthcare facility providing free medical services.',
    category: 'healthcare',
    subcategory: 'Government Hospital',
    location: {
      type: 'Point',
      coordinates: [76.9620, 11.0120],
      address: 'Avinashi Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641018'
    },
    contact: {
      phone: '+91 9876543216'
    },
    timings: {
      monday: { open: '00:00', close: '23:59', closed: false },
      tuesday: { open: '00:00', close: '23:59', closed: false },
      wednesday: { open: '00:00', close: '23:59', closed: false },
      thursday: { open: '00:00', close: '23:59', closed: false },
      friday: { open: '00:00', close: '23:59', closed: false },
      saturday: { open: '00:00', close: '23:59', closed: false },
      sunday: { open: '00:00', close: '23:59', closed: false }
    },
    amenities: ['Emergency Care', 'Free Treatment', 'Pharmacy', 'Ambulance'],
    tags: ['healthcare', 'hospital', 'emergency', 'free'],
    isActive: true
  }
];

// Seed function
const seedMapData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Service.deleteMany({});
    console.log('Cleared existing service data');
    
    // Insert new data
    const insertedServices = await Service.insertMany(mapData);
    console.log(`✅ Successfully seeded ${insertedServices.length} map locations`);
    
    // Create geospatial index for location-based queries
    await Service.collection.createIndex({ location: '2dsphere' });
    console.log('✅ Created geospatial index for location queries');
    
    console.log('\n📍 Seeded Categories:');
    const categories = [...new Set(mapData.map(item => item.subcategory))];
    categories.forEach(cat => {
      const count = mapData.filter(item => item.subcategory === cat).length;
      console.log(`   ${cat}: ${count} locations`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding map data:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedMapData();
}

module.exports = { seedMapData, mapData };
