import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "");
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error; // Re-throw the error instead of exiting
  }
};

export default connectDB;
