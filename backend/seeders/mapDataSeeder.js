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

// Urban Aid Map Data for Coimbatore
const mapData = [
  // Free Food Locations
  {
    name: 'Annapoorna Community Kitchen',
    description: 'Free meals available from 12 PM to 2 PM daily. Serves traditional South Indian meals.',
    category: 'restaurant',
    subcategory: 'Free Food',
    location: {
      type: 'Point',
      coordinates: [76.9558, 11.0168], // RS Puram
      address: 'RS Puram, Coimbatore',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641002'
    },
    contact: {
      phone: '+91 9876543210',
      email: 'annapoorna@example.com'
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
    tags: ['free', 'food', 'community', 'lunch'],
    isActive: true
  },
  {
    name: 'Akshaya Patra Distribution Center',
    description: 'NGO providing free nutritious meals to underprivileged communities.',
    category: 'Free Food',
    subcategory: 'NGO Distribution',
    location: {
      type: 'Point',
      coordinates: [76.9600, 11.0200], // Gandhipuram
      address: 'Gandhipuram, Coimbatore, Tamil Nadu 641012'
    },
    contact: {
      phone: '+91 9876543211'
    },
    timings: {
      monday: '11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM',
      tuesday: '11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM',
      wednesday: '11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM',
      thursday: '11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM',
      friday: '11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM',
      saturday: '11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM',
      sunday: 'Closed'
    },
    amenities: ['Free Meals', 'Takeaway Available'],
    tags: ['free', 'food', 'ngo', 'meals'],
    isActive: true
  },

  // Night Shelter Locations
  {
    name: 'Municipal Night Shelter',
    description: 'Safe overnight accommodation with basic facilities. Registration required.',
    category: 'Night Shelter',
    subcategory: 'Government Shelter',
    location: {
      type: 'Point',
      coordinates: [76.9520, 11.0180], // Town Hall area
      address: 'Town Hall Road, Coimbatore, Tamil Nadu 641001'
    },
    contact: {
      phone: '+91 9876543212'
    },
    timings: {
      monday: '7:00 PM - 6:00 AM',
      tuesday: '7:00 PM - 6:00 AM',
      wednesday: '7:00 PM - 6:00 AM',
      thursday: '7:00 PM - 6:00 AM',
      friday: '7:00 PM - 6:00 AM',
      saturday: '7:00 PM - 6:00 AM',
      sunday: '7:00 PM - 6:00 AM'
    },
    amenities: ['Beds', 'Blankets', 'Security', 'Basic Toilets'],
    tags: ['shelter', 'night', 'accommodation', 'safe'],
    isActive: true
  },
  {
    name: 'Hope Foundation Shelter',
    description: 'NGO-run shelter providing temporary accommodation and counseling services.',
    category: 'Night Shelter',
    subcategory: 'NGO Shelter',
    location: {
      type: 'Point',
      coordinates: [76.9480, 11.0220], // Peelamedu
      address: 'Peelamedu, Coimbatore, Tamil Nadu 641004'
    },
    contact: {
      phone: '+91 9876543213'
    },
    timings: {
      monday: '6:00 PM - 7:00 AM',
      tuesday: '6:00 PM - 7:00 AM',
      wednesday: '6:00 PM - 7:00 AM',
      thursday: '6:00 PM - 7:00 AM',
      friday: '6:00 PM - 7:00 AM',
      saturday: '6:00 PM - 7:00 AM',
      sunday: '6:00 PM - 7:00 AM'
    },
    amenities: ['Beds', 'Counseling', 'Medical Aid', 'Job Assistance'],
    tags: ['shelter', 'ngo', 'counseling', 'support'],
    isActive: true
  },

  // Public Restrooms
  {
    name: 'Cross Cut Road Public Toilet',
    description: 'Clean public restroom facility maintained by the corporation.',
    category: 'Public Restrooms',
    subcategory: 'Corporation Facility',
    location: {
      type: 'Point',
      coordinates: [76.9580, 11.0180], // Cross Cut Road
      address: 'Cross Cut Road, Coimbatore, Tamil Nadu 641001'
    },
    timings: {
      monday: '5:00 AM - 10:00 PM',
      tuesday: '5:00 AM - 10:00 PM',
      wednesday: '5:00 AM - 10:00 PM',
      thursday: '5:00 AM - 10:00 PM',
      friday: '5:00 AM - 10:00 PM',
      saturday: '5:00 AM - 10:00 PM',
      sunday: '5:00 AM - 10:00 PM'
    },
    amenities: ['Clean Toilets', 'Water Supply', 'Lighting'],
    tags: ['restroom', 'public', 'clean', 'accessible'],
    isActive: true
  },
  {
    name: 'Railway Station Public Facility',
    description: 'Public restroom facility at Coimbatore Junction Railway Station.',
    category: 'Public Restrooms',
    subcategory: 'Railway Facility',
    location: {
      type: 'Point',
      coordinates: [76.9550, 11.0070], // Railway Station
      address: 'Coimbatore Junction, Railway Station Road, Coimbatore'
    },
    timings: {
      monday: '24 Hours',
      tuesday: '24 Hours',
      wednesday: '24 Hours',
      thursday: '24 Hours',
      friday: '24 Hours',
      saturday: '24 Hours',
      sunday: '24 Hours'
    },
    amenities: ['24/7 Access', 'Paid Facility', 'Clean Toilets'],
    tags: ['restroom', 'railway', '24hours', 'paid'],
    isActive: true
  },

  // Study Zones
  {
    name: 'District Central Library Study Hall',
    description: 'Quiet study space with free WiFi and reading materials. AC facility available.',
    category: 'Study Zones',
    subcategory: 'Public Library',
    location: {
      type: 'Point',
      coordinates: [76.9500, 11.0150], // Town Hall area
      address: 'Town Hall, Coimbatore, Tamil Nadu 641001'
    },
    contact: {
      phone: '+91 9876543214'
    },
    timings: {
      monday: '9:00 AM - 8:00 PM',
      tuesday: '9:00 AM - 8:00 PM',
      wednesday: '9:00 AM - 8:00 PM',
      thursday: '9:00 AM - 8:00 PM',
      friday: '9:00 AM - 8:00 PM',
      saturday: '9:00 AM - 6:00 PM',
      sunday: 'Closed'
    },
    amenities: ['Free WiFi', 'AC', 'Reading Materials', 'Silent Zone'],
    tags: ['study', 'library', 'wifi', 'quiet'],
    isActive: true
  },
  {
    name: 'PSG College Community Study Center',
    description: 'Open study space for students with charging points and group study areas.',
    category: 'Study Zones',
    subcategory: 'College Facility',
    location: {
      type: 'Point',
      coordinates: [76.9400, 11.0250], // Peelamedu
      address: 'Peelamedu, Coimbatore, Tamil Nadu 641004'
    },
    contact: {
      phone: '+91 9876543215'
    },
    timings: {
      monday: '8:00 AM - 10:00 PM',
      tuesday: '8:00 AM - 10:00 PM',
      wednesday: '8:00 AM - 10:00 PM',
      thursday: '8:00 AM - 10:00 PM',
      friday: '8:00 AM - 10:00 PM',
      saturday: '8:00 AM - 8:00 PM',
      sunday: '10:00 AM - 6:00 PM'
    },
    amenities: ['Free WiFi', 'Charging Points', 'Group Study', 'Individual Desks'],
    tags: ['study', 'college', 'group', 'charging'],
    isActive: true
  },

  // Healthcare Facilities
  {
    name: 'Government General Hospital',
    description: 'Primary healthcare facility providing free medical services.',
    category: 'Healthcare',
    subcategory: 'Government Hospital',
    location: {
      type: 'Point',
      coordinates: [76.9620, 11.0120], // Hospital area
      address: 'Avinashi Road, Coimbatore, Tamil Nadu 641018'
    },
    contact: {
      phone: '+91 9876543216'
    },
    timings: {
      monday: '24 Hours',
      tuesday: '24 Hours',
      wednesday: '24 Hours',
      thursday: '24 Hours',
      friday: '24 Hours',
      saturday: '24 Hours',
      sunday: '24 Hours'
    },
    amenities: ['Emergency Care', 'Free Treatment', 'Pharmacy', 'Ambulance'],
    tags: ['healthcare', 'hospital', 'emergency', 'free'],
    isActive: true
  },

  // Water Points
  {
    name: 'Corporation Water Kiosk',
    description: 'Clean drinking water facility maintained by the city corporation.',
    category: 'Water Points',
    subcategory: 'Corporation Facility',
    location: {
      type: 'Point',
      coordinates: [76.9540, 11.0190], // Central area
      address: 'Big Bazaar Street, Coimbatore, Tamil Nadu 641001'
    },
    timings: {
      monday: '6:00 AM - 10:00 PM',
      tuesday: '6:00 AM - 10:00 PM',
      wednesday: '6:00 AM - 10:00 PM',
      thursday: '6:00 AM - 10:00 PM',
      friday: '6:00 AM - 10:00 PM',
      saturday: '6:00 AM - 10:00 PM',
      sunday: '6:00 AM - 10:00 PM'
    },
    amenities: ['Clean Water', 'Free Access', 'Filtered Water'],
    tags: ['water', 'drinking', 'clean', 'free'],
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
    const categories = [...new Set(mapData.map(item => item.category))];
    categories.forEach(cat => {
      const count = mapData.filter(item => item.category === cat).length;
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
