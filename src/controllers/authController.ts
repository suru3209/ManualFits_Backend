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
      // If user exists but email is not verified, allow resending OTP
      if (!existingUser.isEmailVerified) {
        // Generate new OTP and update existing user
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        existingUser.otp = otp;
        existingUser.otpExpiresAt = otpExpiresAt;
        existingUser.password = await bcrypt.hash(password, 10); // Update password
        existingUser.username = username; // Update username
        await existingUser.save();

        // Send OTP email
        try {
          const emailHtml = createOTPEmailTemplate(username, otp);
          await sendEmail({
            to: email,
            subject: "Verify Your Email - Manualfits",
            html: emailHtml,
          });
          console.log(`✅ Email sent successfully to ${email}`);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // For development: Log OTP to console
          console.log(`🔑 DEVELOPMENT OTP for ${email}: ${otp}`);
          console.log(
            "⚠️  Email sending failed, but OTP is logged above for testing"
          );
        }

        // Generate JWT token for existing user
        const token = jwt.sign(
          { id: existingUser._id, email: existingUser.email },
          process.env.JWT_SECRET as string,
          { expiresIn: "7d" }
        );

        return res.status(200).json({
          message: "Email not verified. New OTP sent to your email.",
          token,
          user: {
            id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            isEmailVerified: existingUser.isEmailVerified,
          },
        });
      } else {
        // Email is already verified - allow direct login
        const token = jwt.sign(
          { id: existingUser._id, email: existingUser.email },
          process.env.JWT_SECRET as string,
          { expiresIn: "7d" }
        );

        return res.status(200).json({
          message: "Email already verified. You are now logged in.",
          token,
          user: {
            id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            isEmailVerified: existingUser.isEmailVerified,
          },
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and set expiry (5 minutes from now)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone: undefined, // Explicitly set to undefined to avoid null values
      isEmailVerified: false,
      otp,
      otpExpiresAt,
    });

    await newUser.save();

    // Send OTP email
    try {
      const emailHtml = createOTPEmailTemplate(username, otp);
      await sendEmail({
        to: email,
        subject: "Verify Your Email - Manualfits",
        html: emailHtml,
      });
      console.log(`✅ Email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // For development: Log OTP to console
      console.log(`🔑 DEVELOPMENT OTP for ${email}: ${otp}`);
      console.log(
        "⚠️  Email sending failed, but OTP is logged above for testing"
      );
      // Don't fail the signup if email sending fails
    }

    // Generate JWT token for immediate login after signup
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification OTP.",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isEmailVerified: newUser.isEmailVerified,
      },
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
      { id: user._id, email: user.email },
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

// Verify Email with OTP
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
      console.log(`✅ Resend OTP email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // For development: Log OTP to console
      console.log(`🔑 DEVELOPMENT OTP for ${email}: ${otp}`);
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
