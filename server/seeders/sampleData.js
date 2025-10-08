const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');

// Sample users
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
    name: 'Rajesh Kumar',
    email: 'rajesh@gmail.com',
    password: 'user123',
    phone: '+91 9876543211',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Priya Sharma',
    email: 'priya@gmail.com',
    password: 'user123',
    phone: '+91 9876543212',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Hotel Paradise Owner',
    email: 'paradise@hotel.com',
    password: 'business123',
    phone: '+91 9876543213',
    role: 'business',
    isVerified: true
  },
  {
    name: 'Restaurant Owner',
    email: 'owner@restaurant.com',
    password: 'business123',
    phone: '+91 9876543214',
    role: 'business',
    isVerified: true
  }
];

// Sample affordable food services for Coimbatore gig workers
const services = [
  // Free/Low-cost food options
  {
    name: 'Annapoorna Mess',
    description: 'Affordable South Indian meals for workers. Full meals starting from ₹25. Free water and buttermilk.',
    category: 'food',
    subcategory: 'Meals',
    location: {
      coordinates: [76.9558, 11.0168], // Coimbatore coordinates
      address: 'RS Puram Main Road, Near Bus Stand',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641002'
    },
    contact: {
      phone: '+91 422 2544321',
      email: 'info@annapoorna.com',
      website: 'https://annapoorna.com'
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
    rating: { average: 4.5, count: 234 },
    images: [
      { url: '/images/annapoorna-1.jpg', alt: 'Restaurant interior', isPrimary: true },
      { url: '/images/annapoorna-2.jpg', alt: 'South Indian thali' }
    ],
    amenities: ['AC', 'Family Dining', 'Parking', 'Online Ordering'],
    priceRange: '₹₹',
    isActive: true,
    isVerified: true,
    tags: ['vegetarian', 'south indian', 'family restaurant', 'traditional']
  },
  {
    name: 'Shree Mithai',
    description: 'Famous sweet shop and restaurant known for authentic North Indian sweets, chaat, and vegetarian meals.',
    category: 'restaurant',
    subcategory: 'Sweets & Snacks',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Cross Cut Road, Gandhipuram',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641012'
    },
    contact: {
      phone: '+91 422 2445566',
      email: 'orders@shreemithai.com'
    },
    timings: {
      monday: { open: '08:00', close: '21:00' },
      tuesday: { open: '08:00', close: '21:00' },
      wednesday: { open: '08:00', close: '21:00' },
      thursday: { open: '08:00', close: '21:00' },
      friday: { open: '08:00', close: '21:00' },
      saturday: { open: '08:00', close: '21:00' },
      sunday: { open: '08:00', close: '21:00' }
    },
    rating: { average: 4.2, count: 156 },
    images: [
      { url: '/images/mithai-1.jpg', alt: 'Sweet display', isPrimary: true }
    ],
    amenities: ['Takeaway', 'Home Delivery', 'Sweets', 'Chaat'],
    priceRange: '₹',
    isActive: true,
    isVerified: true,
    tags: ['sweets', 'north indian', 'chaat', 'vegetarian']
  },

  // Hotels
  {
    name: 'Hotel Paradise',
    description: 'Luxury business hotel in the heart of Coimbatore with modern amenities, conference facilities, and excellent service.',
    category: 'hotel',
    subcategory: 'Business Hotel',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Avinashi Road, Near Airport',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641014'
    },
    contact: {
      phone: '+91 422 6677889',
      email: 'reservations@hotelparadise.com',
      website: 'https://hotelparadise.com'
    },
    timings: {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' }
    },
    rating: { average: 4.7, count: 89 },
    images: [
      { url: '/images/paradise-1.jpg', alt: 'Hotel exterior', isPrimary: true },
      { url: '/images/paradise-2.jpg', alt: 'Deluxe room' }
    ],
    amenities: ['WiFi', 'AC', 'Restaurant', 'Gym', 'Pool', 'Conference Hall', 'Parking'],
    priceRange: '₹₹₹',
    isActive: true,
    isVerified: true,
    tags: ['business hotel', 'luxury', 'conference', 'airport nearby']
  },

  // Utilities
  {
    name: 'Quick Fix Electronics',
    description: 'Professional electronics repair service for smartphones, laptops, TVs, and home appliances with genuine parts.',
    category: 'utility',
    subcategory: 'Electronics Repair',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Oppanakara Street, Town Hall',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001'
    },
    contact: {
      phone: '+91 422 2334455',
      email: 'service@quickfix.com'
    },
    timings: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '19:00' },
      saturday: { open: '09:00', close: '19:00' },
      sunday: { closed: true }
    },
    rating: { average: 4.3, count: 67 },
    images: [
      { url: '/images/quickfix-1.jpg', alt: 'Repair shop', isPrimary: true }
    ],
    amenities: ['Home Service', 'Warranty', 'Genuine Parts', 'Quick Repair'],
    priceRange: '₹₹',
    isActive: true,
    isVerified: true,
    tags: ['electronics', 'repair', 'mobile', 'laptop', 'home service']
  },

  // Education
  {
    name: 'Bright Minds Coaching Center',
    description: 'Premier coaching institute for competitive exams including JEE, NEET, and state entrance exams with experienced faculty.',
    category: 'education',
    subcategory: 'Coaching Institute',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Peelamedu, Near PSG College',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004'
    },
    contact: {
      phone: '+91 422 2567890',
      email: 'admissions@brightminds.com',
      website: 'https://brightminds.com'
    },
    timings: {
      monday: { open: '06:00', close: '20:00' },
      tuesday: { open: '06:00', close: '20:00' },
      wednesday: { open: '06:00', close: '20:00' },
      thursday: { open: '06:00', close: '20:00' },
      friday: { open: '06:00', close: '20:00' },
      saturday: { open: '06:00', close: '20:00' },
      sunday: { open: '08:00', close: '18:00' }
    },
    rating: { average: 4.6, count: 123 },
    images: [
      { url: '/images/brightminds-1.jpg', alt: 'Classroom', isPrimary: true }
    ],
    amenities: ['AC Classrooms', 'Library', 'Test Series', 'Doubt Clearing', 'Study Material'],
    priceRange: '₹₹₹',
    isActive: true,
    isVerified: true,
    tags: ['coaching', 'jee', 'neet', 'competitive exams', 'education']
  },

  // Healthcare
  {
    name: 'City Care Clinic',
    description: 'Multi-specialty clinic with experienced doctors providing quality healthcare services including general medicine and diagnostics.',
    category: 'healthcare',
    subcategory: 'Multi-Specialty Clinic',
    location: {
      coordinates: [76.9558, 11.0168],
      address: 'Saibaba Colony, Near Ganga Hospital',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641011'
    },
    contact: {
      phone: '+91 422 2678901',
      email: 'appointments@citycare.com'
    },
    timings: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '09:00', close: '13:00' }
    },
    rating: { average: 4.4, count: 98 },
    images: [
      { url: '/images/citycare-1.jpg', alt: 'Clinic reception', isPrimary: true }
    ],
    amenities: ['Online Booking', 'Lab Tests', 'Pharmacy', 'Emergency Care', 'Insurance'],
    priceRange: '₹₹',
    isActive: true,
    isVerified: true,
    tags: ['healthcare', 'clinic', 'doctor', 'medicine', 'diagnostics']
  }
];

// Sample reviews
const reviews = [
  {
    rating: 5,
    title: 'Excellent South Indian Food!',
    comment: 'Amazing authentic taste and great service. The sambar and rasam were outstanding. Highly recommended for families.',
    images: [{ url: '/images/review-food-1.jpg', alt: 'Delicious meal' }]
  },
  {
    rating: 4,
    title: 'Good value for money',
    comment: 'Clean place with decent food quality. Service could be faster during peak hours.',
    images: []
  },
  {
    rating: 5,
    title: 'Best hotel in Coimbatore',
    comment: 'Stayed here for business trip. Excellent rooms, great breakfast, and professional staff. Will definitely come back.',
    images: []
  }
];


// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Review.deleteMany({});
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

    // Create services with owners
    const servicesWithOwners = services.map((service, index) => ({
      ...service,
      owner: createdUsers[index % 3 + 2]._id // Assign to business users
    }));
    const createdServices = await Service.insertMany(servicesWithOwners);
    console.log(`✅ Created ${createdServices.length} services`);

    // Create reviews
    const reviewsWithRefs = reviews.map((review, index) => ({
      ...review,
      service: createdServices[index % createdServices.length]._id,
      user: createdUsers[index % 2 + 1]._id // Regular users
    }));
    const createdReviews = await Review.insertMany(reviewsWithRefs);
    console.log(`✅ Created ${createdReviews.length} reviews`);


    // Update service ratings based on reviews
    for (const service of createdServices) {
      const serviceReviews = createdReviews.filter(
        review => review.service.toString() === service._id.toString()
      );
      
      if (serviceReviews.length > 0) {
        const avgRating = serviceReviews.reduce((sum, review) => sum + review.rating, 0) / serviceReviews.length;
        await Service.findByIdAndUpdate(service._id, {
          'rating.average': Math.round(avgRating * 10) / 10,
          'rating.count': serviceReviews.length
        });
      }
    }
    console.log('✅ Updated service ratings');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`🏪 Services: ${createdServices.length}`);
    console.log(`⭐ Reviews: ${createdReviews.length}`);
    console.log(`📅 Bookings: ${createdBookings.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@namacity.com / admin123');
    console.log('User 1: rajesh@gmail.com / user123');
    console.log('User 2: priya@gmail.com / user123');
    console.log('Business 1: paradise@hotel.com / business123');
    console.log('Business 2: owner@restaurant.com / business123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

module.exports = { seedDatabase };
