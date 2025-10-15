import express from "express";
import {
  getSettings,
  updateSettings,
  testEmailConfiguration,
} from "../controllers/settingsController";
import { adminAuth } from "../middleware/adminAuthMiddleware";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

router.get("/", getSettings);
router.put("/", updateSettings);
router.post("/test-email", testEmailConfiguration);

export default router;
