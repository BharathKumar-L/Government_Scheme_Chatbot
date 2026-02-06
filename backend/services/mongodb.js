const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ruralconnect';

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI not found in environment variables. Using local MongoDB.');
    }

    const isAtlas = typeof MONGODB_URI === 'string' && MONGODB_URI.startsWith('mongodb+srv://');
    
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
      retryWrites: true,
      w: 'majority',
      // Enable TLS only for Atlas connections. Local MongoDB typically does not use TLS.
      tls: isAtlas,
      tlsAllowInvalidCertificates: isAtlas ? false : undefined
    };

    // Mask credentials when logging
    const maskedUri = (MONGODB_URI || '').replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1***:***@');
    console.log('Attempting to connect to MongoDB...');
    console.log('Using MongoDB URI:', maskedUri || '<none>');

    await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return mongoose.connection;
  } catch (error) {
    if (error.name === 'MongoServerSelectionError') {
      console.error('❌ Could not connect to MongoDB server. If using Atlas, please check:');
      console.error('   1. Your network connection');
      console.error('   2. IP whitelist in Atlas');
      console.error('   3. Username and password in connection string');
      console.error('   4. Database name in connection string');
    }
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Check if MongoDB is connected
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get MongoDB connection status
 */
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
}

module.exports = {
  connectToMongoDB,
  disconnectFromMongoDB,
  isConnected,
  getConnectionStatus,
  mongoose
};