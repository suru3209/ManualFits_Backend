import express from "express";
import {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  createProduct,
  getProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getAllReviews,
  updateReview,
  deleteReview,
  getReturnReplaceRequests,
  updateReturnReplaceStatus,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPermissions,
  updateAdminPermissions,
  getPaymentSettings,
  updatePaymentSettings,
  adminImageUpload,
  getPublicPaymentSettings,
  getAdminProfile,
  updateAdminProfile,
  getDashboardChartData,
} from "../controllers/adminController";
import { adminAuth } from "../middleware/adminAuthMiddleware";
import HiddenProducts from "../models/HiddenProducts";
import {
  uploadSingle,
  uploadSingleMiddleware,
} from "../controllers/uploadController";

const router = express.Router();

// Admin login (no auth required)
router.post("/login", adminLogin);

// Public payment settings (no auth required)
router.get("/public/payment-settings", getPublicPaymentSettings);

// All other routes require admin authentication
router.use(adminAuth);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Users
router.get("/users", getAllUsers);

// Orders
router.get("/orders", getAllOrders);
router.put("/orders/:orderId/status", updateOrderStatus);

// Products
router.get("/products", getAllProducts);
router.post("/products", createProduct);
router.get("/products/:productId", getProduct);
router.put("/products/:productId", updateProduct);
router.put("/products/:productId/status", updateProductStatus);
router.delete("/products/:productId", deleteProduct);

// Reviews
router.get("/reviews", getAllReviews);
router.put("/reviews/:reviewId", updateReview);
router.delete("/reviews/:reviewId", deleteReview);

// Return/Replace
router.get("/return-replace", getReturnReplaceRequests);
router.put("/return-replace/:requestId/status", updateReturnReplaceStatus);

// Hidden Products
router.get("/hidden-products", async (req, res) => {
  try {
    const hiddenProducts = await HiddenProducts.findOne();
    res.json({
      message: "Hidden products fetched successfully",
      hiddenProducts: hiddenProducts?.productNames || [],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching hidden products",
      error: error instanceof Error ? error.message : error,
    });
  }
});

router.post("/hidden-products", async (req, res) => {
  try {
    const { productNames } = req.body;
    const adminId = req.admin?.id || "unknown";

    const hiddenProducts = await HiddenProducts.findOneAndUpdate(
      {},
      { productNames, updatedBy: adminId },
      { upsert: true, new: true }
    );

    res.json({
      message: "Hidden products updated successfully",
      hiddenProducts: hiddenProducts.productNames,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating hidden products",
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Admin Management
router.get("/admins", getAllAdmins);
router.post("/admins", createAdmin);
router.put("/admins/:adminId", updateAdmin);
router.delete("/admins/:adminId", deleteAdmin);

// Permissions
router.get("/permissions", getPermissions);
router.put("/admins/:adminId/permissions", updateAdminPermissions);

// Payment Settings
router.get("/payment-settings", getPaymentSettings);
router.put("/payment-settings", updatePaymentSettings);

// Admin Upload
router.post("/upload", uploadSingleMiddleware, adminImageUpload);

// Admin Profile
router.get("/profile", adminAuth, getAdminProfile);
router.put("/profile", adminAuth, updateAdminProfile);

// Dashboard Chart Data
router.get("/dashboard/chart-data", adminAuth, getDashboardChartData);

export default router;
