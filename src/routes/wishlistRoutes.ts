import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All wishlist routes require authentication
router.use(authMiddleware);

// Get user's wishlist
router.get("/", getWishlist);

// Add item to wishlist
router.post("/", addToWishlist);

// Remove item from wishlist
router.delete("/:productId", removeFromWishlist);

// Clear entire wishlist
router.delete("/", clearWishlist);

export default router;
