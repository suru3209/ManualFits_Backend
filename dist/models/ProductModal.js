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
exports.Subcategories = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.Subcategories = [
    "T-Shirts",
    "Shirts",
    "Jeans",
    "Jackets",
    "Hoodies",
    "Shorts",
    "Track Pants",
    "Blazers",
    "Sportswear",
    "Ethnic Wear",
    "Innerwear",
    "Casual Wear",
    "Office Wear",
    "Party Wear",
    "Traditional",
    "Street Style",
    "Dresses",
    "Tops",
    "Skirts",
    "Jeans",
    "Ethnic Wear",
    "Winter",
    "Lingerie",
    "Casual Daywear",
    "Office Formals",
    "Party Evening",
    "Wedding",
    "Beach",
    "Festive",
    "Sneakers",
    "Formal Shoes",
    "Casual Shoes",
    "Sports Shoes",
    "Boots",
    "Sandals",
    "Flats",
    "Heels",
    "Loafers",
    "Oxfords",
    "Bags",
    "Wallets",
    "Belts",
    "Watches",
    "Sunglasses",
    "Jewelry",
    "Hats",
    "Scarves",
    "Gloves",
    "Phone Cases",
    "Just Launched",
    "Trending Now",
    "Limited Edition",
    "Designer Collabs",
    "Seasonal Picks",
    "Celebrity Styles",
    "Viral Fashions",
];
const specificationSchema = new mongoose_1.Schema({
    key: { type: String, required: true },
    value: { type: String, required: true },
});
const variantPairSchema = new mongoose_1.Schema({
    images: [{ type: String, required: true }],
    size: { type: String, required: true },
    color: { type: String, required: true },
    colorCode: { type: String },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    sku: { type: String, required: true, unique: true },
    isAvailable: { type: Boolean, default: true },
});
const productSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ["Men", "Women", "Kids", "Footwear", "Accessories", "New Arrivals"],
        required: true,
    },
    subcategory: {
        type: [String],
        enum: exports.Subcategories,
    },
    brand: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    status: {
        type: String,
        default: "active",
        enum: ["active", "draft", "archived"],
    },
    variants: [variantPairSchema],
    totalStock: { type: Number, required: true, min: 0, default: 0 },
    cloudinaryPublicIds: { type: [String], default: [] },
    slug: { type: String, required: true, unique: true, lowercase: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: [{ type: String, trim: true }],
    detailedDescription: { type: String },
    specifications: [specificationSchema],
    careInstructions: [{ type: String }],
    keyFeatures: [{ type: String }],
    material: { type: String },
    weight: { type: String },
    warranty: { type: String },
    origin: { type: String },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
productSchema.virtual("discountPercent").get(function () {
    if (this.variants && this.variants.length > 0) {
        let totalDiscount = 0;
        let variantCount = 0;
        this.variants.forEach((variant) => {
            if (variant.originalPrice > 0) {
                totalDiscount +=
                    ((variant.originalPrice - variant.price) / variant.originalPrice) *
                        100;
                variantCount++;
            }
        });
        return variantCount > 0 ? Math.round(totalDiscount / variantCount) : 0;
    }
    return 0;
});
productSchema.virtual("inStock").get(function () {
    return this.totalStock > 0;
});
productSchema.pre("save", function (next) {
    if (this.isModified("title") && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    }
    next();
});
productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
