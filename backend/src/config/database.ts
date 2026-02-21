import mongoose from 'mongoose';

// Cache the database connection
let cachedConnection: typeof mongoose | null = null;

const connectDB = async (): Promise<typeof mongoose> => {
  // If we have a cached connection, check if it's still alive
  if (cachedConnection && cachedConnection.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedConnection;
  }

  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: process.env.VERCEL === '1' ? 5 : 10, // Smaller pool for serverless
      serverSelectionTimeoutMS: process.env.VERCEL === '1' ? 5000 : 10000, // Faster timeout for serverless
      socketTimeoutMS: 45000,
      connectTimeoutMS: process.env.VERCEL === '1' ? 5000 : 10000,
    };

    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(
      process.env.MONGODB_URI,
      opts
    );
    
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    conn.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cachedConnection = null;
    });
    
    conn.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      cachedConnection = null;
    });
    
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cachedConnection = null;
    throw error;
  }
};

export default connectDB;
