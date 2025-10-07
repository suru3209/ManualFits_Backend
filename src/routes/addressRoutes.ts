import { Router } from "express";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All address routes require authentication
router.use(authMiddleware);

// Get user's addresses
router.get("/", getAddresses);

// Add new address
router.post("/", addAddress);

// Update address
router.put("/:addressId", updateAddress);

// Delete address
router.delete("/:addressId", deleteAddress);

// Set default address
router.patch("/:addressId/default", setDefaultAddress);

export default router;
