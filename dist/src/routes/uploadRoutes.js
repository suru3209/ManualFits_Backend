"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadController_1 = require("../controllers/uploadController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/single", authMiddleware_1.authMiddleware, uploadController_1.uploadSingleMiddleware, uploadController_1.uploadSingle);
router.post("/multiple", authMiddleware_1.authMiddleware, uploadController_1.uploadMultipleMiddleware, uploadController_1.uploadMultiple);
router.delete("/:publicId", authMiddleware_1.authMiddleware, uploadController_1.deleteImage);
exports.default = router;
