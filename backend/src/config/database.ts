import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-erp');
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;
