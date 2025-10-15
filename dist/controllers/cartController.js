"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.updateCartQuantity = exports.removeFromCart = exports.addToCart = exports.getCart = void 0;
const User_1 = __importDefault(require("../models/User"));
const ProductModal_1 = __importDefault(require("../models/ProductModal"));
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId).populate("cart.productId");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.cart.forEach((item, index) => {
            console.log(`Cart item ${index}:`, {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                addedAt: item.addedAt,
                productTitle: item.productId?.title || item.productId?.name,
            });
        });
        res.json({
            message: "Cart retrieved successfully",
            cart: user.cart,
        });
    }
    catch (error) {
        console.error("Error getting cart:", error);
        res
            .status(500)
            .json({ message: "Error retrieving cart", error: error.message });
    }
};
exports.getCart = getCart;
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity, size, color } = req.body;
        console.log("Adding to cart:", {
            userId,
            productId,
            quantity,
            size,
            color,
        });
        if (!productId || !quantity) {
            return res
                .status(400)
                .json({ message: "Product ID and quantity are required" });
        }
        const product = await ProductModal_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const existingItemIndex = user.cart.findIndex((item) => item.productId.toString() === productId);
        let newQuantity = quantity;
        if (existingItemIndex !== -1) {
            newQuantity = user.cart[existingItemIndex].quantity + quantity;
        }
        if (product.totalStock < newQuantity) {
            return res.status(400).json({
                message: `Insufficient stock for ${product.title}. Available: ${product.totalStock}, Requested: ${newQuantity}`,
            });
        }
        if (existingItemIndex !== -1) {
            user.cart[existingItemIndex].quantity = newQuantity;
            user.cart[existingItemIndex].size = size;
            user.cart[existingItemIndex].color = color;
        }
        else {
            user.cart.push({
                productId,
                quantity,
                size,
                color,
                addedAt: new Date(),
            });
        }
        console.log("Updated cart item:", {
            productId,
            quantity: newQuantity,
            size,
            color,
        });
        await user.save();
        res.json({
            message: "Item added to cart successfully",
            cart: user.cart,
        });
    }
    catch (error) {
        console.error("Error adding to cart:", error);
        res
            .status(500)
            .json({ message: "Error adding to cart", error: error.message });
    }
};
exports.addToCart = addToCart;
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.cart = user.cart.filter((item) => item.productId.toString() !== productId);
        await user.save();
        res.json({
            message: "Item removed from cart successfully",
            cart: user.cart,
        });
    }
    catch (error) {
        console.error("Error removing from cart:", error);
        res
            .status(500)
            .json({ message: "Error removing from cart", error: error.message });
    }
};
exports.removeFromCart = removeFromCart;
const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;
        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const itemIndex = user.cart.findIndex((item) => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }
        user.cart[itemIndex].quantity = quantity;
        await user.save();
        res.json({
            message: "Cart quantity updated successfully",
            cart: user.cart,
        });
    }
    catch (error) {
        console.error("Error updating cart quantity:", error);
        res
            .status(500)
            .json({ message: "Error updating cart quantity", error: error.message });
    }
};
exports.updateCartQuantity = updateCartQuantity;
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.cart = [];
        await user.save();
        res.json({
            message: "Cart cleared successfully",
            cart: user.cart,
        });
    }
    catch (error) {
        console.error("Error clearing cart:", error);
        res
            .status(500)
            .json({ message: "Error clearing cart", error: error.message });
    }
};
exports.clearCart = clearCart;
