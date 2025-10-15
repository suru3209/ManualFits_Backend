import { Request, Response } from "express";
import User from "../models/User";
import Product from "../models/ProductModal";

// Get user's cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).populate("cart.productId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log cart items with variant details
    user.cart.forEach((item: any, index: number) => {
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
  } catch (error: any) {
    console.error("Error getting cart:", error);
    res
      .status(500)
      .json({ message: "Error retrieving cart", error: error.message });
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(
      (item: any) => item.productId.toString() === productId
    );

    let newQuantity = quantity;
    if (existingItemIndex !== -1) {
      newQuantity = user.cart[existingItemIndex].quantity + quantity;
    }

    // Check total stock availability
    if (product.totalStock < newQuantity) {
      return res.status(400).json({
        message: `Insufficient stock for ${product.title}. Available: ${product.totalStock}, Requested: ${newQuantity}`,
      });
    }

    if (existingItemIndex !== -1) {
      // Update quantity and variant details
      user.cart[existingItemIndex].quantity = newQuantity;
      user.cart[existingItemIndex].size = size;
      user.cart[existingItemIndex].color = color;
    } else {
      // Add new item with variant details
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
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ message: "Error adding to cart", error: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove item from cart
    user.cart = user.cart.filter(
      (item: any) => item.productId.toString() !== productId
    );

    await user.save();

    res.json({
      message: "Item removed from cart successfully",
      cart: user.cart,
    });
  } catch (error: any) {
    console.error("Error removing from cart:", error);
    res
      .status(500)
      .json({ message: "Error removing from cart", error: error.message });
  }
};

// Update cart item quantity
export const updateCartQuantity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and update item
    const itemIndex = user.cart.findIndex(
      (item: any) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    user.cart[itemIndex].quantity = quantity;
    await user.save();

    res.json({
      message: "Cart quantity updated successfully",
      cart: user.cart,
    });
  } catch (error: any) {
    console.error("Error updating cart quantity:", error);
    res
      .status(500)
      .json({ message: "Error updating cart quantity", error: error.message });
  }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = [];
    await user.save();

    res.json({
      message: "Cart cleared successfully",
      cart: user.cart,
    });
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    res
      .status(500)
      .json({ message: "Error clearing cart", error: error.message });
  }
};
