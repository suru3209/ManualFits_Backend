"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const adminAuthMiddleware_1 = require("../middleware/adminAuthMiddleware");
const HiddenProducts_1 = __importDefault(require("../models/HiddenProducts"));
const router = (0, express_1.Router)();
router.post("/login", adminController_1.adminLogin);
router.use(adminAuthMiddleware_1.adminAuth);
router.get("/dashboard/stats", adminController_1.getDashboardStats);
router.get("/users", adminController_1.getAllUsers);
router.get("/orders", adminController_1.getAllOrders);
router.put("/orders/:orderId/status", adminController_1.updateOrderStatus);
router.get("/products", adminController_1.getAllProducts);
router.post("/products", adminController_1.createProduct);
router.get("/products/:productId", adminController_1.getProduct);
router.put("/products/:productId", adminController_1.updateProduct);
router.put("/products/:productId/status", adminController_1.updateProductStatus);
router.delete("/products/:productId", adminController_1.deleteProduct);
router.get("/reviews", adminController_1.getAllReviews);
router.delete("/reviews/:reviewId", adminController_1.deleteReview);
router.get("/return-replace", adminController_1.getReturnReplaceRequests);
router.put("/return-replace/:requestId/status", adminController_1.updateReturnReplaceStatus);
router.get("/hidden-products", async (req, res) => {
    try {
        const hiddenProducts = await HiddenProducts_1.default.findOne();
        res.json({
            message: "Hidden products fetched successfully",
            hiddenProducts: hiddenProducts?.productNames || [],
        });
    }
    catch (error) {
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
        const hiddenProducts = await HiddenProducts_1.default.findOneAndUpdate({}, { productNames, updatedBy: adminId }, { upsert: true, new: true });
        res.json({
            message: "Hidden products updated successfully",
            hiddenProducts: hiddenProducts.productNames,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating hidden products",
            error: error instanceof Error ? error.message : error,
        });
    }
});
router.get("/admins", adminController_1.getAllAdmins);
router.post("/create", adminController_1.createAdmin);
router.put("/admins/:adminId", adminController_1.updateAdmin);
router.delete("/admins/:adminId", adminController_1.deleteAdmin);
router.get("/permissions", adminController_1.getPermissions);
router.put("/admins/:adminId/permissions", adminController_1.updateAdminPermissions);
exports.default = router;
