import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "../models/Admin";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log(
        "Please use the existing credentials or create a new admin through the admin panel."
      );
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new Admin({
      username: "admin",
      email: "admin@manualfits.com",
      password: hashedPassword,
      role: "super_admin",
      permissions: [
        "products.create",
        "products.read",
        "products.update",
        "products.delete",
        "orders.read",
        "orders.update",
        "users.read",
        "users.update",
        "users.delete",
        "reviews.read",
        "reviews.update",
        "reviews.delete",
        "coupons.create",
        "coupons.read",
        "coupons.update",
        "coupons.delete",
        "analytics.read",
        "settings.read",
        "settings.update",
        "admins.create",
        "admins.read",
        "admins.update",
        "admins.delete",
        "support.view",
        "support.create",
        "support.update",
        "support.delete",
      ],
      isActive: true,
    });

    await admin.save();
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run the script
createAdminUser();
