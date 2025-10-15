"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../controllers/reviewController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/product/:productId", reviewController_1.getProductReviews);
router.get("/can-review/:productId", authMiddleware_1.authenticateToken, reviewController_1.checkUserCanReview);
router.post("/", authMiddleware_1.authenticateToken, reviewController_1.createReview);
router.put("/:reviewId", authMiddleware_1.authenticateToken, reviewController_1.updateReview);
router.delete("/:reviewId", authMiddleware_1.authenticateToken, reviewController_1.deleteReview);
router.post("/:reviewId/like", authMiddleware_1.authenticateToken, reviewController_1.toggleReviewLike);
exports.default = router;
