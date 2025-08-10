const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedAffordableFoodData } = require('../seeders/affordableFoodData');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const runFoodSeeder = async () => {
  try {
    console.log('🍽️ Starting Namma City Food Discovery seeder...\n');
    
    await connectDB();
    await seedAffordableFoodData();
    
    console.log('\n✨ Food data seeding completed successfully!');
    console.log('🎯 App is now ready for affordable food discovery!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Food seeding failed:', error);
    process.exit(1);
  }
};

runFoodSeeder();
