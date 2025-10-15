import express from "express";
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  getVariantDetails,
  addProduct,
  updateProduct,
  updateVariantStock,
  deleteProduct,
  searchProducts,
} from "../controllers/productVariantController";
import { adminAuth as adminAuthMiddleware } from "../middleware/adminAuthMiddleware";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);
router.get("/:id/variant", getVariantDetails);

// Admin routes (protected)
router.post("/add", adminAuthMiddleware, addProduct);
router.put("/update/:id", adminAuthMiddleware, updateProduct);
router.patch("/update-stock/:id", adminAuthMiddleware, updateVariantStock);
router.delete("/delete/:id", adminAuthMiddleware, deleteProduct);

export default router;
