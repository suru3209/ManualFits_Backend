import express from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  checkUserCanReview,
  toggleReviewLike,
} from "../controllers/reviewController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Get reviews for a specific product (public route)
router.get("/product/:productId", getProductReviews);

// Check if user can review a product (protected route)
router.get("/can-review/:productId", authenticateToken, checkUserCanReview);

// Create a new review (protected route)
router.post("/", authenticateToken, createReview);

// Update a review (protected route)
router.put("/:reviewId", authenticateToken, updateReview);

// Delete a review (protected route)
router.delete("/:reviewId", authenticateToken, deleteReview);

// Like/Unlike a review (protected route)
router.post("/:reviewId/like", authenticateToken, toggleReviewLike);

export default router;
