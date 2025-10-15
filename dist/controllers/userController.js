"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfileImage = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            image: user.image,
            cloudinaryPublicId: user.cloudinaryPublicId,
            dob: user.dob,
            gender: user.gender,
            addresses: user.addresses,
            saved_payments: user.saved_payments,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
        res.json({
            message: "User profile retrieved successfully",
            user: userData,
        });
    }
    catch (error) {
        console.error("Error getting user profile:", error);
        res
            .status(500)
            .json({ message: "Error retrieving user profile", error: error.message });
    }
};
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, phone, image, dob, gender } = req.body;
            username,
            email,
            phone,
            image,
            dob,
            gender,
        });
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (username)
            user.username = username;
        if (email)
            user.email = email;
        if (phone !== undefined)
            user.phone = phone;
        if (image !== undefined)
            user.image = image;
        if (dob !== undefined)
            user.dob = dob;
        if (gender !== undefined)
            user.gender = gender;
        await user.save();
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            image: user.image,
            dob: user.dob,
            gender: user.gender,
            addresses: user.addresses,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
        res.json({
            message: "User profile updated successfully",
            user: userData,
        });
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        res
            .status(500)
            .json({ message: "Error updating user profile", error: error.message });
    }
};
exports.updateUserProfile = updateUserProfile;
const updateUserProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { image, cloudinaryPublicId } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.cloudinaryPublicId) {
            await (0, cloudinaryUpload_1.deleteFromCloudinary)(user.cloudinaryPublicId);
        }
        user.image = image;
        user.cloudinaryPublicId = cloudinaryPublicId;
        await user.save();
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            image: user.image,
            cloudinaryPublicId: user.cloudinaryPublicId,
            dob: user.dob,
            gender: user.gender,
            addresses: user.addresses,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
        res.json({
            message: "User profile image updated successfully",
            user: userData,
        });
    }
    catch (error) {
        console.error("Error updating user profile image:", error);
        res.status(500).json({
            message: "Error updating user profile image",
            error: error.message,
        });
    }
};
exports.updateUserProfileImage = updateUserProfileImage;
