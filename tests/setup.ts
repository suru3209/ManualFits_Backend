import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Set test environment
process.env.NODE_ENV = "test";

beforeAll(async () => {
  // Connect to test database
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/manualfits_test";
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
});

// Global test timeout
jest.setTimeout(30000);
