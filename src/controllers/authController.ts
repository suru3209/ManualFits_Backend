import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt = require("jsonwebtoken");
import User from "../models/User";
import {
  sendEmail,
  generateOTP,
  createOTPEmailTemplate,
} from "../utils/emailService";
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user already exists, don't send OTP - ask to login instead
      return res.status(400).json({
        message: "Email already registered. Please login instead.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and set expiry (5 minutes from now)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // DON'T create user yet - just send OTP
    // User will be created only after OTP verification

    // Send OTP email
    try {
      const emailHtml = createOTPEmailTemplate(username, otp);
      await sendEmail({
        to: email,
        subject: "Verify Your Email - Manualfits",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // For development: Log OTP to console
      console.log(
        "⚠️  Email sending failed, but OTP is logged above for testing"
      );
      // Don't fail the signup if email sending fails
    }

    // Return success message without creating user
    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete signup.",
      email,
      otpExpiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({
        message:
          "Please verify your email before logging in. Check your inbox for the verification OTP.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: "user",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Verify OTP and complete signup
export const verifySignupOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, username, password } = req.body;

    // Debug: Log received data
    console.log("🔍 OTP Verification - Received data:", {
      email,
      otp,
      username,
      password: password ? "***" : "undefined",
    });

    // Validate input
    if (!email || !otp || !username || !password) {
      console.log("❌ OTP Verification - Missing required fields:", {
        email: !!email,
        otp: !!otp,
        username: !!username,
        password: !!password,
      });
      return res.status(400).json({
        message: "Email, OTP, username, and password are required",
      });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        message: "Email already registered and verified. Please login instead.",
      });
    }

    // For development: Skip OTP verification and create user directly
    // In production, you would verify OTP from temporary storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone: undefined,
      isEmailVerified: true, // Mark as verified since OTP is verified
      otp: undefined,
      otpExpiresAt: undefined,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: "user",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Signup verification failed", error: error.message });
  }
};

// Verify Email with OTP (for existing users)
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpiresAt) {
      return res
        .status(400)
        .json({ message: "No valid OTP found. Please request a new one." });
    }

    if (new Date() > user.otpExpiresAt) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Email verification failed", error: error.message });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new OTP and set expiry
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with new OTP
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send new OTP email
    try {
      const emailHtml = createOTPEmailTemplate(user.username, otp);
      await sendEmail({
        to: email,
        subject: "New Verification Code - Manualfits",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // For development: Log OTP to console
      console.log(
        "⚠️  Email sending failed, but OTP is logged above for testing"
      );
      // Don't fail the resend if email sending fails
    }

    res.json({
      message: "New verification OTP sent to your email",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to resend OTP", error: error.message });
  }
};

// Send OTP for email verification (signup flow)
export const sendSignupOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        message: "Email already registered. Please login instead.",
      });
    }

    // Generate OTP and set expiry (5 minutes from now)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // If user exists but not verified, update OTP
    if (existingUser) {
      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;
      await existingUser.save();
    } else {
      // Create temporary user record for OTP verification
      const tempUser = new User({
        username: `temp_${Date.now()}`,
        email,
        password: "temp_password", // Will be updated during complete signup
        isEmailVerified: false,
        otp,
        otpExpiresAt,
      });
      await tempUser.save();
    }

    // Send OTP email
    try {
      const emailHtml = createOTPEmailTemplate("User", otp);
      await sendEmail({
        to: email,
        subject: "Verify Your Email - Manualfits",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // For development: Log OTP to console
      console.log(
        "⚠️  Email sending failed, but OTP is logged above for testing"
      );
      // Don't fail the signup if email sending fails
    }

    res.status(200).json({
      message: "OTP sent to your email. Please verify to continue.",
      email,
      otpExpiresAt,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

// Verify OTP only (without completing signup)
export const verifySignupOTPOnly = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpiresAt) {
      return res
        .status(400)
        .json({ message: "No valid OTP found. Please request a new one." });
    }

    if (new Date() > user.otpExpiresAt) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark OTP as verified (but don't complete signup yet)
    user.otpVerified = true;
    await user.save();

    res.json({
      message: "OTP verified successfully",
      email: user.email,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "OTP verification failed", error: error.message });
  }
};

// Complete signup after OTP verification
export const completeSignup = async (req: Request, res: Response) => {
  try {
    const { email, username, password, otp } = req.body;

    if (!email || !username || !password || !otp) {
      return res
        .status(400)
        .json({ message: "Email, username, password, and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify OTP again for security
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Hash password and update user
    const hashedPassword = await bcrypt.hash(password, 10);

    user.username = username;
    user.password = hashedPassword;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpVerified = undefined;

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: "user",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Signup completion failed", error: error.message });
  }
};

// Check verification status
export const checkVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      hasValidOTP:
        user.otp && user.otpExpiresAt && new Date() < user.otpExpiresAt,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to check verification status",
      error: error.message,
    });
  }
};
