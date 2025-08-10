const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Service = require('../models/Service');

// Sample users - simplified for food discovery app
const users = [
  {
    name: 'Admin User',
    email: 'admin@namacity.com',
    password: 'admin123',
    phone: '+91 9876543210',
    role: 'admin',
    isVerified: true
  },
  {
    name: 'Ravi Kumar',
    email: 'ravi@gmail.com',
    password: 'user123',
    phone: '+91 9876543211',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Priya Worker',
    email: 'priya@gmail.com',
    password: 'user123',
    phone: '+91 9876543212',
    role: 'user',
    isVerified: true
  }
];

// Affordable food places for gig workers in Coimbatore
const affordableFoodServices = [
  {
    name: 'Annapoorna Workers Mess',
    description: 'Full South Indian meals for ₹25. Free unlimited rice, sambar, rasam. Popular with auto drivers and delivery workers.',
    category: 'food',
    subcategory: 'Meals',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'RS Puram Main Road, Near Bus Stand',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641002'
    },
    contact: {
      phone: '+91 422 2544321',
      email: 'info@annapoorna.com'
    },
    timings: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '06:00', close: '22:00' },
      sunday: { open: '06:00', close: '22:00' }
    },
    images: [
      { url: '/images/annapoorna-meals.jpg', alt: 'Affordable South Indian meals', isPrimary: true }
    ],
    amenities: ['Free Water', 'Buttermilk', 'Parking for 2-wheelers', 'Quick Service'],
    priceRange: '₹',
    isActive: true,
    isVerified: true,
    tags: ['cheap meals', 'south indian', 'workers mess', 'unlimited rice'],
    specialOffers: 'Free buttermilk with every meal. 10% discount for delivery partners.'
  },
  {
    name: 'Saravana Bhavan Tiffin Center',
    description: 'Morning tiffin items from ₹15. Idli, dosa, pongal. Free chutney and sambar refills.',
    category: 'food',
    subcategory: 'Tiffin',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Cross Cut Road, Gandhipuram',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641012'
    },
    contact: {
      phone: '+91 422 2445566'
    },
    timings: {
      monday: { open: '06:00', close: '11:00' },
      tuesday: { open: '06:00', close: '11:00' },
      wednesday: { open: '06:00', close: '11:00' },
      thursday: { open: '06:00', close: '11:00' },
      friday: { open: '06:00', close: '11:00' },
      saturday: { open: '06:00', close: '11:00' },
      sunday: { open: '06:00', close: '11:00' }
    },
    images: [
      { url: '/images/tiffin-center.jpg', alt: 'Morning tiffin items', isPrimary: true }
    ],
    amenities: ['Early Morning', 'Free Refills', 'Takeaway', 'Quick Service'],
    priceRange: '₹',
    isActive: true,
    isVerified: true,
    tags: ['breakfast', 'tiffin', 'idli dosa', 'morning food'],
    specialOffers: 'Buy 4 idlis, get 1 free. Special combo for ₹20.'
  },
  {
    name: 'Ganga Free Food Center',
    description: 'FREE lunch for job seekers and daily wage workers. Served 12-2 PM. No questions asked.',
    category: 'food',
    subcategory: 'Free Food',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Saibaba Colony, Near Ganga Hospital',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641011'
    },
    contact: {
      phone: '+91 422 2678901'
    },
    timings: {
      monday: { open: '12:00', close: '14:00' },
      tuesday: { open: '12:00', close: '14:00' },
      wednesday: { open: '12:00', close: '14:00' },
      thursday: { open: '12:00', close: '14:00' },
      friday: { open: '12:00', close: '14:00' },
      saturday: { open: '12:00', close: '14:00' },
      sunday: { closed: true }
    },
    images: [
      { url: '/images/free-food.jpg', alt: 'Free lunch service', isPrimary: true }
    ],
    amenities: ['Completely Free', 'No ID Required', 'Clean Food', 'Respectful Service'],
    priceRange: 'FREE',
    isActive: true,
    isVerified: true,
    tags: ['free food', 'charity', 'lunch', 'job seekers', 'daily wage'],
    specialOffers: 'Completely FREE lunch for anyone in need. Rice, dal, vegetable, pickle.'
  },
  {
    name: 'Workers Tea Stall',
    description: 'Tea ₹5, Coffee ₹8, Biscuits ₹2. Popular spot for auto drivers and construction workers.',
    category: 'food',
    subcategory: 'Tea & Snacks',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Oppanakara Street, Town Hall',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    contact: {
      phone: '+91 422 2334455'
    },
    timings: {
      monday: { open: '05:00', close: '22:00' },
      tuesday: { open: '05:00', close: '22:00' },
      wednesday: { open: '05:00', close: '22:00' },
      thursday: { open: '05:00', close: '22:00' },
      friday: { open: '05:00', close: '22:00' },
      saturday: { open: '05:00', close: '22:00' },
      sunday: { open: '05:00', close: '22:00' }
    },
    images: [
      { url: '/images/tea-stall.jpg', alt: 'Roadside tea stall', isPrimary: true }
    ],
    amenities: ['24/7 Open', 'Roadside', 'Quick Service', 'Credit Available'],
    priceRange: '₹',
    isActive: true,
    isVerified: true,
    tags: ['tea', 'coffee', 'cheap snacks', 'roadside', 'workers hangout'],
    specialOffers: 'Buy 10 teas, get 1 free. Credit available for regular customers.'
  },
  {
    name: 'Amma Canteen',
    description: 'Government subsidized meals. Breakfast ₹5, Lunch ₹10, Dinner ₹15. Clean and hygienic.',
    category: 'food',
    subcategory: 'Government Canteen',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Peelamedu, Near PSG College',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004'
    },
    contact: {
      phone: '+91 422 2567890'
    },
    timings: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '07:00', close: '21:00' },
      sunday: { open: '07:00', close: '21:00' }
    },
    images: [
      { url: '/images/amma-canteen.jpg', alt: 'Government subsidized canteen', isPrimary: true }
    ],
    amenities: ['Government Subsidized', 'Clean & Hygienic', 'All Day Meals', 'Fixed Prices'],
    priceRange: '₹',
    isActive: true,
    isVerified: true,
    tags: ['government canteen', 'subsidized', 'cheap meals', 'hygienic'],
    specialOffers: 'Fixed government rates. Breakfast ₹5, Lunch ₹10, Dinner ₹15.'
  },
  {
    name: 'Street Food Corner',
    description: 'Pani puri ₹10, Bhel puri ₹15, Vada pav ₹8. Evening snacks for workers heading home.',
    category: 'food',
    subcategory: 'Street Food',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Brookefields Mall Road, Evening Market',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    contact: {
      phone: '+91 9876543210'
    },
    timings: {
      monday: { open: '16:00', close: '22:00' },
      tuesday: { open: '16:00', close: '22:00' },
      wednesday: { open: '16:00', close: '22:00' },
      thursday: { open: '16:00', close: '22:00' },
      friday: { open: '16:00', close: '22:00' },
      saturday: { open: '16:00', close: '22:00' },
      sunday: { open: '16:00', close: '22:00' }
    },
    images: [
      { url: '/images/street-food.jpg', alt: 'Evening street food', isPrimary: true }
    ],
    amenities: ['Evening Only', 'Fresh Made', 'Popular Spot', 'Quick Bites'],
    priceRange: '₹',
    isActive: true,
    isVerified: true,
    tags: ['street food', 'evening snacks', 'pani puri', 'cheap eats'],
    specialOffers: 'Combo offer: Pani puri + Bhel puri for ₹20.'
  }
];

// Seed function for affordable food data
const seedAffordableFoodData = async () => {
  try {
    console.log('🍽️ Starting affordable food data seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create affordable food services
    const servicesWithOwners = affordableFoodServices.map((service, index) => ({
      ...service,
      owner: createdUsers[0]._id // Admin owns all services
    }));
    const createdServices = await Service.insertMany(servicesWithOwners);
    console.log(`✅ Created ${createdServices.length} affordable food services`);

    console.log('🎉 Affordable food data seeding completed successfully!');
    console.log('\n📋 Food Services Summary:');
    console.log(`🍽️ Total Food Places: ${createdServices.length}`);
    console.log(`💰 Free Food Places: ${createdServices.filter(s => s.priceRange === 'FREE').length}`);
    console.log(`₹ Cheap Food Places: ${createdServices.filter(s => s.priceRange === '₹').length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@namacity.com / admin123');
    console.log('User 1: ravi@gmail.com / user123');
    console.log('User 2: priya@gmail.com / user123');

    console.log('\n🍽️ Food Categories Available:');
    const categories = [...new Set(createdServices.map(s => s.subcategory))];
    categories.forEach(cat => console.log(`- ${cat}`));

  } catch (error) {
    console.error('❌ Affordable food seeding failed:', error);
    throw error;
  }
};

module.exports = { seedAffordableFoodData };
