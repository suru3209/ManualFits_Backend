import { Router } from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "../controllers/cartController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get("/", getCart);

// Add item to cart
router.post("/", addToCart);

// Remove item from cart
router.delete("/:productId", removeFromCart);

// Update cart item quantity
router.put("/:productId", updateCartQuantity);

// Clear entire cart
router.delete("/", clearCart);

export default router;
