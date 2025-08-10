const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedDatabase } = require('../seeders/sampleData');

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

const runSeeder = async () => {
  try {
    console.log('🚀 Starting Namma City database seeder...\n');
    
    await connectDB();
    await seedDatabase();
    
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv[2] === '--destroy') {
  console.log('⚠️  Destroy mode not implemented for safety');
  process.exit(1);
}

runSeeder();
