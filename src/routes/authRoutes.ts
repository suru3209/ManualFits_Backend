import { Router } from "express";
import {
  signup,
  login,
  verifyEmail,
  resendOTP,
  checkVerificationStatus,
} from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/check-verification", checkVerificationStatus);

export default router;
