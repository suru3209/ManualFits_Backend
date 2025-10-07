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
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    images: { type: [String], required: true },
    cloudinaryPublicIds: { type: [String] },
    category: {
        type: String,
        enum: ["Men", "Women", "Kids", "Footwear", "Accessories", "New Arrivals"],
        required: true,
    },
    subcategory: {
        type: [String],
        enum: exports.Subcategories,
        required: true,
    },
    colors: { type: [String], required: true },
    sizes: [
        {
            size: { type: String, required: true },
            stock: { type: Number, required: true },
        },
    ],
    slug: { type: String, required: true, unique: true, lowercase: true },
    totalStock: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["active", "draft", "archived"],
        default: "active",
    },
    discountType: {
        type: String,
        enum: ["percentage", "flat"],
        default: "percentage",
    },
    discount: { type: Number, default: 0 },
    discountEnd: { type: Date },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, min: 1, max: 5, default: 1 },
    reviews: { type: Number, default: 0 },
    brand: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String] },
    sku: { type: String },
    detailedDescription: { type: String },
    specifications: [specificationSchema],
    careInstructions: { type: [String] },
    keyFeatures: { type: [String] },
    material: { type: String },
    weight: { type: String },
    warranty: { type: String },
    origin: { type: String },
    variants: [
        {
            color: { type: String },
            images: [{ type: String }],
            sizes: [
                {
                    size: { type: String },
                    stock: { type: Number },
                },
            ],
        },
    ],
}, { timestamps: true });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
