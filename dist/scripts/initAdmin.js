"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Admin_1 = __importDefault(require("../models/Admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const initAdmin = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        const existingAdmin = await Admin_1.default.findOne({ username: "suru3209" });
        if (existingAdmin) {
            console.log("Admin user already exists");
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash("Sury@108", 12);
        const admin = new Admin_1.default({
            username: "suru3209",
            password: hashedPassword,
            role: "super_admin",
            permissions: [
                "users_manage",
                "products_manage",
                "orders_manage",
                "reviews_manage",
                "analytics_view",
                "settings_manage",
                "returns_manage",
            ],
            isActive: true,
        });
        await admin.save();
        console.log("Admin user created successfully");
        console.log("Username: suru3209");
        console.log("Password: Sury@108");
    }
    catch (error) {
        console.error("Error initializing admin:", error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
    }
};
initAdmin();
