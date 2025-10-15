"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productVariantController_1 = require("../controllers/productVariantController");
const adminAuthMiddleware_1 = require("../middleware/adminAuthMiddleware");
const router = express_1.default.Router();
router.get("/", productVariantController_1.getAllProducts);
router.get("/search", productVariantController_1.searchProducts);
router.get("/slug/:slug", productVariantController_1.getProductBySlug);
router.get("/:id", productVariantController_1.getProductById);
router.get("/:id/variant", productVariantController_1.getVariantDetails);
router.post("/add", adminAuthMiddleware_1.adminAuth, productVariantController_1.addProduct);
router.put("/update/:id", adminAuthMiddleware_1.adminAuth, productVariantController_1.updateProduct);
router.patch("/update-stock/:id", adminAuthMiddleware_1.adminAuth, productVariantController_1.updateVariantStock);
router.delete("/delete/:id", adminAuthMiddleware_1.adminAuth, productVariantController_1.deleteProduct);
exports.default = router;
