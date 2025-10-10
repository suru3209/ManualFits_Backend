import { Router } from "express";
import {
  signup,
  login,
  verifyEmail,
  verifySignupOTP,
  resendOTP,
  checkVerificationStatus,
  sendSignupOTP,
  verifySignupOTPOnly,
  completeSignup,
} from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/verify-signup-otp", verifySignupOTP);
router.post("/resend-otp", resendOTP);
router.post("/check-verification", checkVerificationStatus);
router.post("/send-signup-otp", sendSignupOTP);
router.post("/verify-signup-otp-only", verifySignupOTPOnly);
router.post("/complete-signup", completeSignup);

export default router;
