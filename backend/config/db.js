const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  // Prevent multiple connection attempts
  if (isConnecting) {
    console.log('Connection attempt already in progress...');
    return;
  }

  isConnecting = true;

  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Set mongoose options for better connection handling
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      // Other supported options
      connectTimeoutMS: 10000,
      retryWrites: true,
      // Built-in keep-alive using newer options
      heartbeatFrequencyMS: 10000,
      // Auto reconnect is enabled by default in newer versions
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);

    // Reset connecting flag on successful connection
    isConnecting = false;

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnecting = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnecting = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnecting = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    isConnecting = false;

    // Don't exit process in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      // In production, wait before retrying
      console.log('Will attempt to reconnect in 5 seconds...');
      setTimeout(connectDB, 5000);
    }
  }
};

module.exports = connectDB;
