"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const couponController_1 = require("../controllers/couponController");
const adminAuthMiddleware_1 = require("../middleware/adminAuthMiddleware");
const router = express_1.default.Router();
router.post("/validate", couponController_1.validateCoupon);
router.use(adminAuthMiddleware_1.adminAuth);
router.get("/", couponController_1.getAllCoupons);
router.post("/", couponController_1.createCoupon);
router.get("/:couponId", couponController_1.getCoupon);
router.put("/:couponId", couponController_1.updateCoupon);
router.delete("/:couponId", couponController_1.deleteCoupon);
exports.default = router;
