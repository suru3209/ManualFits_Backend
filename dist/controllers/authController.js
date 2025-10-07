"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt = require("jsonwebtoken");
const User_1 = __importDefault(require("../models/User"));
const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = new User_1.default({
            username,
            email,
            password: hashedPassword,
            phone: undefined,
        });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
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
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({
            message: "Login successful",
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};
exports.login = login;
