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
const AddressSchema = new mongoose_1.Schema({
    address_id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    is_default: { type: Boolean, default: false },
});
const UPISchema = new mongoose_1.Schema({
    upi_id: { type: String, required: true },
    name: { type: String, required: true },
    is_default: { type: Boolean, default: false },
});
const CardSchema = new mongoose_1.Schema({
    card_id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    card_type: String,
    brand: String,
    last4: String,
    expiry_month: Number,
    expiry_year: Number,
    cardholder_name: String,
    is_default: { type: Boolean, default: false },
    token: String,
});
const GiftCardSchema = new mongoose_1.Schema({
    giftcard_id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    code: String,
    balance: Number,
    expiry_date: Date,
    is_active: { type: Boolean, default: true },
});
const UserSchema = new mongoose_1.Schema({
    image: { type: String },
    cloudinaryPublicId: { type: String },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    otpVerified: { type: Boolean },
    addresses: [AddressSchema],
    saved_payments: {
        upi: [UPISchema],
        cards: [CardSchema],
        gift_cards: [GiftCardSchema],
    },
    cart: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: { type: Number, required: true, min: 1 },
            size: { type: String },
            color: { type: String },
            addedAt: { type: Date, default: Date.now },
        },
    ],
    wishlist: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            addedAt: { type: Date, default: Date.now },
        },
    ],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", UserSchema);
exports.default = User;
