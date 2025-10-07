import { Router } from "express";
import {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  updateProductStatus,
  getAllReviews,
  deleteReview,
  getReturnReplaceRequests,
  updateReturnReplaceStatus,
  createProduct,
  updateProduct,
  getProduct,
  deleteProduct,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPermissions,
  updateAdminPermissions,
} from "../controllers/adminController";
import { adminAuth } from "../middleware/adminAuthMiddleware";
import HiddenProducts from "../models/HiddenProducts";

const router = Router();

// Admin authentication
router.post("/login", adminLogin);

// Apply authentication middleware to all other routes
router.use(adminAuth);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Users management
router.get("/users", getAllUsers);

// Orders management
router.get("/orders", getAllOrders);
router.put("/orders/:orderId/status", updateOrderStatus);

// Products management
router.get("/products", getAllProducts);
router.post("/products", createProduct);
router.get("/products/:productId", getProduct);
router.put("/products/:productId", updateProduct);
router.put("/products/:productId/status", updateProductStatus);
router.delete("/products/:productId", deleteProduct);

// Reviews management
router.get("/reviews", getAllReviews);
router.delete("/reviews/:reviewId", deleteReview);

// Return/Replace management
router.get("/return-replace", getReturnReplaceRequests);
router.put("/return-replace/:requestId/status", updateReturnReplaceStatus);

// Hidden Products management
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

    // Upsert hidden products list
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

// Admin Management routes
router.get("/admins", getAllAdmins);
router.post("/create", createAdmin);
router.put("/admins/:adminId", updateAdmin);
router.delete("/admins/:adminId", deleteAdmin);
router.get("/permissions", getPermissions);
router.put("/admins/:adminId/permissions", updateAdminPermissions);

export default router;
