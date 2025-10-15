"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWishlist = exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const User_1 = __importDefault(require("../models/User"));
const ProductModal_1 = __importDefault(require("../models/ProductModal"));
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId).populate("wishlist.productId");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            message: "Wishlist retrieved successfully",
            wishlist: user.wishlist,
        });
    }
    catch (error) {
        console.error("Error getting wishlist:", error);
        res
            .status(500)
            .json({ message: "Error retrieving wishlist", error: error.message });
    }
};
exports.getWishlist = getWishlist;
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }
        const product = await ProductModal_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const existingItemIndex = user.wishlist.findIndex((item) => item.productId.toString() === productId);
        if (existingItemIndex !== -1) {
            return res.status(400).json({ message: "Item already in wishlist" });
        }
        user.wishlist.push({ productId, addedAt: new Date() });
        await user.save();
        res.json({
            message: "Item added to wishlist successfully",
            wishlist: user.wishlist,
        });
    }
    catch (error) {
        console.error("Error adding to wishlist:", error);
        res
            .status(500)
            .json({ message: "Error adding to wishlist", error: error.message });
    }
};
exports.addToWishlist = addToWishlist;
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.wishlist = user.wishlist.filter((item) => item.productId.toString() !== productId);
        await user.save();
        res.json({
            message: "Item removed from wishlist successfully",
            wishlist: user.wishlist,
        });
    }
    catch (error) {
        console.error("Error removing from wishlist:", error);
        res
            .status(500)
            .json({ message: "Error removing from wishlist", error: error.message });
    }
};
exports.removeFromWishlist = removeFromWishlist;
const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.wishlist = [];
        await user.save();
        res.json({
            message: "Wishlist cleared successfully",
            wishlist: user.wishlist,
        });
    }
    catch (error) {
        console.error("Error clearing wishlist:", error);
        res
            .status(500)
            .json({ message: "Error clearing wishlist", error: error.message });
    }
};
exports.clearWishlist = clearWishlist;
