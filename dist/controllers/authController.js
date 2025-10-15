"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVerificationStatus = exports.completeSignup = exports.verifySignupOTPOnly = exports.sendSignupOTP = exports.resendOTP = exports.verifyEmail = exports.verifySignupOTP = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt = require("jsonwebtoken");
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../utils/emailService");
const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered. Please login instead.",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const otp = (0, emailService_1.generateOTP)();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        try {
            const emailHtml = (0, emailService_1.createOTPEmailTemplate)(username, otp);
            await (0, emailService_1.sendEmail)({
                to: email,
                subject: "Verify Your Email - Manualfits",
                html: emailHtml,
            });
        }
        catch (emailError) {
            console.error("Failed to send verification email:", emailError);
        }
        res.status(200).json({
            message: "OTP sent to your email. Please verify to complete signup.",
            email,
            otpExpiresAt,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Signup failed", error: error.message });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        if (!user.isEmailVerified) {
            return res.status(400).json({
                message: "Please verify your email before logging in. Check your inbox for the verification OTP.",
            });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};
exports.login = login;
const verifySignupOTP = async (req, res) => {
    try {
        const { email, otp, username, password } = req.body;
            email,
            otp,
            username,
            password: password ? "***" : "undefined",
        });
        if (!email || !otp || !username || !password) {
                email: !!email,
                otp: !!otp,
                username: !!username,
                password: !!password,
            });
            return res.status(400).json({
                message: "Email, OTP, username, and password are required",
            });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser && existingUser.isEmailVerified) {
            return res.status(400).json({
                message: "Email already registered and verified. Please login instead.",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = new User_1.default({
            username,
            email,
            password: hashedPassword,
            phone: undefined,
            isEmailVerified: true,
            otp: undefined,
            otpExpiresAt: undefined,
        });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Signup verification failed", error: error.message });
    }
};
exports.verifySignupOTP = verifySignupOTP;
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }
        if (!user.otp || !user.otpExpiresAt) {
            return res
                .status(400)
                .json({ message: "No valid OTP found. Please request a new one." });
        }
        if (new Date() > user.otpExpiresAt) {
            user.otp = undefined;
            user.otpExpiresAt = undefined;
            await user.save();
            return res
                .status(400)
                .json({ message: "OTP has expired. Please request a new one." });
        }
        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
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
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Email verification failed", error: error.message });
    }
};
exports.verifyEmail = verifyEmail;
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }
        const otp = (0, emailService_1.generateOTP)();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();
        try {
            const emailHtml = (0, emailService_1.createOTPEmailTemplate)(user.username, otp);
            await (0, emailService_1.sendEmail)({
                to: email,
                subject: "New Verification Code - Manualfits",
                html: emailHtml,
            });
        }
        catch (emailError) {
            console.error("Failed to send verification email:", emailError);
        }
        res.json({
            message: "New verification OTP sent to your email",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to resend OTP", error: error.message });
    }
};
exports.resendOTP = resendOTP;
const sendSignupOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser && existingUser.isEmailVerified) {
            return res.status(400).json({
                message: "Email already registered. Please login instead.",
            });
        }
        const otp = (0, emailService_1.generateOTP)();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        if (existingUser) {
            existingUser.otp = otp;
            existingUser.otpExpiresAt = otpExpiresAt;
            await existingUser.save();
        }
        else {
            const tempUser = new User_1.default({
                username: `temp_${Date.now()}`,
                email,
                password: "temp_password",
                isEmailVerified: false,
                otp,
                otpExpiresAt,
            });
            await tempUser.save();
        }
        try {
            const emailHtml = (0, emailService_1.createOTPEmailTemplate)("User", otp);
            await (0, emailService_1.sendEmail)({
                to: email,
                subject: "Verify Your Email - Manualfits",
                html: emailHtml,
            });
        }
        catch (emailError) {
            console.error("Failed to send verification email:", emailError);
        }
        res.status(200).json({
            message: "OTP sent to your email. Please verify to continue.",
            email,
            otpExpiresAt,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to send OTP", error: error.message });
    }
};
exports.sendSignupOTP = sendSignupOTP;
const verifySignupOTPOnly = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (!user.otp || !user.otpExpiresAt) {
            return res
                .status(400)
                .json({ message: "No valid OTP found. Please request a new one." });
        }
        if (new Date() > user.otpExpiresAt) {
            user.otp = undefined;
            user.otpExpiresAt = undefined;
            await user.save();
            return res
                .status(400)
                .json({ message: "OTP has expired. Please request a new one." });
        }
        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        user.otpVerified = true;
        await user.save();
        res.json({
            message: "OTP verified successfully",
            email: user.email,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "OTP verification failed", error: error.message });
    }
};
exports.verifySignupOTPOnly = verifySignupOTPOnly;
const completeSignup = async (req, res) => {
    try {
        const { email, username, password, otp } = req.body;
        if (!email || !username || !password || !otp) {
            return res
                .status(400)
                .json({ message: "Email, username, password, and OTP are required" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({ message: "OTP has expired" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        user.username = username;
        user.password = hashedPassword;
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        user.otpVerified = undefined;
        await user.save();
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Signup completion failed", error: error.message });
    }
};
exports.completeSignup = completeSignup;
const checkVerificationStatus = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            hasValidOTP: user.otp && user.otpExpiresAt && new Date() < user.otpExpiresAt,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to check verification status",
            error: error.message,
        });
    }
};
exports.checkVerificationStatus = checkVerificationStatus;
