const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Check User model schema
    const User = require('./models/User');
    const schema = User.schema;
    console.log('\n📝 User Schema:');
    console.log(JSON.stringify(schema.obj, null, 2));
    
    // Check if phone is required
    const phonePath = schema.path('phone');
    console.log('\n🔍 Phone field required:', phonePath?.isRequired || false);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
