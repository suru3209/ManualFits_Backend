import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/Admin";
import dotenv from "dotenv";

dotenv.config();

const initAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "suru3209" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("Sury@108", 12);

    // Create admin user
    const admin = new Admin({
      username: "suru3209",
      password: hashedPassword,
      role: "super_admin",
      permissions: [
        "users.view",
        "users.edit",
        "users.delete",
        "products.view",
        "products.create",
        "products.edit",
        "products.delete",
        "orders.view",
        "orders.edit",
        "reviews.view",
        "reviews.delete",
        "returns.view",
        "returns.edit",
        "admins.view",
        "admins.create",
        "admins.edit",
        "admins.delete",
      ],
      isActive: true,
    });

    await admin.save();
    console.log("Admin user created successfully");
    console.log("Username: suru3209");
    console.log("Password: Sury@108");
  } catch (error) {
    console.error("Error initializing admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the script
initAdmin();
