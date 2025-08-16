const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function testSignup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mohanprasath563:0110@cluster0.pvcyzuc.mongodb.net/urbanaid?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test user data
    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      // No phone number provided
    };

    console.log('\n🔧 Creating test user with data:', JSON.stringify(testUser, null, 2));

    // Create user directly
    const user = await User.create(testUser);
    console.log('✅ User created successfully:', user);

    // Find the user to verify
    const foundUser = await User.findById(user._id).lean();
    console.log('\n🔍 Retrieved user from database:');
    console.log(JSON.stringify(foundUser, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSignup();
