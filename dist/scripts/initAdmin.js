"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const Admin_1 = __importDefault(require("../models/Admin"));
dotenv_1.default.config();
const createAdminUser = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || "");
        const existingAdmin = await Admin_1.default.findOne({ username: "admin" });
        if (existingAdmin) {
            console.log("Please use the existing credentials or create a new admin through the admin panel.");
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash("admin123", 10);
        const admin = new Admin_1.default({
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
    }
    catch (error) {
        console.error("❌ Error creating admin user:", error);
    }
    finally {
        await mongoose_1.default.connection.close();
    }
};
createAdminUser();
