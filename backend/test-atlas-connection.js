const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

async function testAtlasConnection() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Attempting to connect to MongoDB Atlas...');
    // Hide sensitive information when logging
    const sanitizedUri = process.env.MONGODB_URI.replace(
      /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
      '$1******:******@'
    );
    console.log('Using connection string:', sanitizedUri);

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      tls: true,
      tlsAllowInvalidCertificates: false
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('\n✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Test database operations
    const collections = await mongoose.connection.db.collections();
    console.log('\n📑 Available collections:', collections.map(c => c.collectionName));

    // Test if we can query the schemes collection
    if (collections.find(c => c.collectionName === 'schemes')) {
      const schemesCount = await mongoose.connection.db.collection('schemes').countDocuments();
      console.log(`\n📋 Number of schemes in database: ${schemesCount}`);
    }

    await mongoose.connection.close();
    console.log('\n🔒 Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Atlas connection error:');
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB Atlas servers.');
      console.error('Please check:');
      console.error('1. Your network connection');
      console.error('2. IP whitelist in Atlas');
      console.error('3. Username and password');
    }
    console.error('\nDetailed error:', error);
    process.exit(1);
  }
}

testAtlasConnection();