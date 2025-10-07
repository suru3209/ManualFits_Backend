import { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  returnReplaceOrder,
} from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// Get user's orders
router.get("/", getOrders);

// Get single order
router.get("/:orderId", getOrder);

// Create new order
router.post("/", createOrder);

// Update order status
router.put("/:orderId/status", updateOrderStatus);

// Cancel order
router.patch("/:orderId/cancel", cancelOrder);

// Return/Replace order
router.patch("/:orderId/return-replace", returnReplaceOrder);

export default router;
