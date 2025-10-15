import { Request, Response } from "express";
import User from "../models/User";
import Product from "../models/ProductModal";

// Get user's wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).populate("wishlist.productId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    res.json({
      message: "Wishlist retrieved successfully",
      wishlist: user.wishlist,
    });
  } catch (error: any) {
    console.error("Error getting wishlist:", error);
    res
      .status(500)
      .json({ message: "Error retrieving wishlist", error: error.message });
  }
};

// Add item to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if item already exists in wishlist
    const existingItemIndex = user.wishlist.findIndex(
      (item: any) => item.productId.toString() === productId
    );

    if (existingItemIndex !== -1) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }

    // Add new item to wishlist
    user.wishlist.push({ productId, addedAt: new Date() });
    await user.save();

    res.json({
      message: "Item added to wishlist successfully",
      wishlist: user.wishlist,
    });
  } catch (error: any) {
    console.error("Error adding to wishlist:", error);
    res
      .status(500)
      .json({ message: "Error adding to wishlist", error: error.message });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove item from wishlist
    user.wishlist = user.wishlist.filter(
      (item: any) => item.productId.toString() !== productId
    );

    await user.save();

    res.json({
      message: "Item removed from wishlist successfully",
      wishlist: user.wishlist,
    });
  } catch (error: any) {
    console.error("Error removing from wishlist:", error);
    res
      .status(500)
      .json({ message: "Error removing from wishlist", error: error.message });
  }
};

// Clear entire wishlist
export const clearWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = [];
    await user.save();

    res.json({
      message: "Wishlist cleared successfully",
      wishlist: user.wishlist,
    });
  } catch (error: any) {
    console.error("Error clearing wishlist:", error);
    res
      .status(500)
      .json({ message: "Error clearing wishlist", error: error.message });
  }
};
