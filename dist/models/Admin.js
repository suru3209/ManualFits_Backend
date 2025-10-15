"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AdminSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email",
        ],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ["super_admin", "admin", "moderator", "viewer"],
        default: "admin",
    },
    permissions: [
        {
            type: String,
            enum: [
                "products.create",
                "products.read",
                "products.update",
                "products.delete",
                "orders.read",
                "orders.update",
                "users.read",
                "users.update",
                "users.delete",
                "reviews.read",
                "reviews.update",
                "reviews.delete",
                "coupons.create",
                "coupons.read",
                "coupons.update",
                "coupons.delete",
                "analytics.read",
                "settings.read",
                "settings.update",
                "admins.create",
                "admins.read",
                "admins.update",
                "admins.delete",
                "support.view",
                "support.create",
                "support.update",
                "support.delete",
                "*",
            ],
        },
    ],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    paymentSettings: {
        qrCodes: [
            {
                imageUrl: { type: String, required: true },
                upiId: { type: String, required: true },
                upiName: { type: String, required: true },
            },
        ],
    },
}, { timestamps: true });
AdminSchema.index({ isActive: 1 });
exports.default = mongoose_1.default.models.Admin ||
    mongoose_1.default.model("Admin", AdminSchema);
