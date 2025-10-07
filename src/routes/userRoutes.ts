import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  updateUserProfileImage,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Get user profile
router.get("/profile", getUserProfile);

// Update user profile
router.put("/profile", updateUserProfile);

// Update user profile image
router.put("/profile/image", updateUserProfileImage);

export default router;
