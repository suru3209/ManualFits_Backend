import express from "express";
import {
  getAllCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController";
import { adminAuth } from "../middleware/adminAuthMiddleware";

const router = express.Router();

// Public route for coupon validation
router.post("/validate", validateCoupon);

// Admin routes (require authentication)
router.use(adminAuth);

router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.get("/:couponId", getCoupon);
router.put("/:couponId", updateCoupon);
router.delete("/:couponId", deleteCoupon);

export default router;
