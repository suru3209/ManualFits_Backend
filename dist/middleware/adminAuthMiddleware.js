"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.adminAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = __importDefault(require("../models/Admin"));
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res
                .status(401)
                .json({ message: "No token, authorization denied" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const admin = await Admin_1.default.findById(decoded.id);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: "Admin not found or inactive" });
        }
        req.admin = {
            id: admin._id.toString(),
            username: admin.username,
            role: admin.role,
            permissions: admin.permissions,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};
exports.adminAuth = adminAuth;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ message: "Admin authentication required" });
        }
        if (req.admin.role === "super_admin" ||
            req.admin.permissions.includes(permission)) {
            next();
        }
        else {
            res.status(403).json({ message: "Insufficient permissions" });
        }
    };
};
exports.requirePermission = requirePermission;
