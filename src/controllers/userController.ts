import { Request, Response } from "express";
import User from "../models/User";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload";

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user data without password
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
  } catch (error: any) {
    console.error("Error getting user profile:", error);
    res
      .status(500)
      .json({ message: "Error retrieving user profile", error: error.message });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { username, email, phone, image, dob, gender } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (image !== undefined) user.image = image;
    if (dob !== undefined) user.dob = dob;
    if (gender !== undefined) user.gender = gender;

    await user.save();

    // Return updated user data without password
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
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Error updating user profile", error: error.message });
  }
};

// Update user profile image
export const updateUserProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { image, cloudinaryPublicId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image from Cloudinary if exists
    if (user.cloudinaryPublicId) {
      await deleteFromCloudinary(user.cloudinaryPublicId);
    }

    // Update user image fields
    user.image = image;
    user.cloudinaryPublicId = cloudinaryPublicId;

    await user.save();

    // Return updated user data
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
  } catch (error: any) {
    console.error("Error updating user profile image:", error);
    res.status(500).json({
      message: "Error updating user profile image",
      error: error.message,
    });
  }
};

// Remove user profile image
export const removeUserProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete image from Cloudinary if exists
    if (user.cloudinaryPublicId) {
      await deleteFromCloudinary(user.cloudinaryPublicId);
    }

    // Remove image fields from user
    user.image = "";
    user.cloudinaryPublicId = "";

    await user.save();

    // Return updated user data
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
      message: "User profile image removed successfully",
      user: userData,
    });
  } catch (error: any) {
    console.error("Error removing user profile image:", error);
    res.status(500).json({
      message: "Error removing user profile image",
      error: error.message,
    });
  }
};
