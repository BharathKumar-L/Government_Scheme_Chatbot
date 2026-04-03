const mongoose = require('mongoose');

let isConnected = false;

const connectMongoDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruralconnect';

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });

    isConnected = true;
    console.log('✓ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    isConnected = false;
    return null;
  }
};

const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error.message);
  }
};

const getMongoDBConnection = () => {
  return mongoose.connection;
};

const isMongoDBConnected = () => isConnected;

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  getMongoDBConnection,
  isMongoDBConnected
};
