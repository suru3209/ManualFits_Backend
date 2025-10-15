"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settingsController_1 = require("../controllers/settingsController");
const adminAuthMiddleware_1 = require("../middleware/adminAuthMiddleware");
const router = express_1.default.Router();
router.use(adminAuthMiddleware_1.adminAuth);
router.get("/", settingsController_1.getSettings);
router.put("/", settingsController_1.updateSettings);
router.post("/test-email", settingsController_1.testEmailConfiguration);
exports.default = router;
