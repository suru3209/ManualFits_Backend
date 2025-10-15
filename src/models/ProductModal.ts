import mongoose, { Schema, Document } from "mongoose";

// Subcategories array - organized by category
export const Subcategories = [
  // Men's Clothing
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

  // Women's Clothing
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

  // Footwear
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

  // Accessories
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

  // New Arrivals (can be any category)
  "Just Launched",
  "Trending Now",
  "Limited Edition",
  "Designer Collabs",
  "Seasonal Picks",
  "Celebrity Styles",
  "Viral Fashions",
] as const;

// TypeScript union type from array
export type Subcategory = (typeof Subcategories)[number];

// Specification Interface
export interface Specification {
  key: string;
  value: string;
}

// Variant Pair Interface - Each pair contains all data for a specific combination
export interface VariantPair {
  _id?: string;
  images: string[]; // Array of images for this variant
  size: string; // Size (S, M, L, XL, etc.)
  color: string; // Color name
  colorCode?: string; // Hex color code
  price: number; // Current price
  originalPrice: number; // Original price for discount calculation
  discount: number; // Discount percentage
  sku: string; // Unique SKU
  isAvailable: boolean; // Availability status
}

// Product Document Interface with Variant Pairs
export interface ProductDocument extends Document {
  title: string;
  description: string;
  category:
    | "Men"
    | "Women"
    | "Kids"
    | "Footwear"
    | "Accessories"
    | "New Arrivals";
  subcategory?: Subcategory[];
  brand: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  status: string; // Add status field
  variants: VariantPair[]; // Changed from sizes to variants

  // SEO and metadata
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // Detailed product information
  detailedDescription?: string;
  specifications?: Specification[];
  careInstructions?: string[];
  keyFeatures?: string[];
  material?: string;
  weight?: string;
  warranty?: string;
  origin?: string;

  // Cloudinary integration
  cloudinaryPublicIds: string[];

  // Virtual fields
  discountPercent: number;
  totalStock: number;
  inStock: boolean;
}

// Specification Schema
const specificationSchema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

// Variant Pair Schema - Simplified structure
const variantPairSchema = new Schema({
  images: [{ type: String, required: true }], // Array of images
  size: { type: String, required: true }, // Size (S, M, L, XL, etc.)
  color: { type: String, required: true }, // Color name
  colorCode: { type: String }, // Hex color code (optional)
  price: { type: Number, required: true, min: 0 }, // Current price
  originalPrice: { type: Number, required: true, min: 0 }, // Original price
  discount: { type: Number, default: 0, min: 0, max: 100 }, // Discount percentage
  sku: { type: String, required: true, unique: true }, // Unique SKU
  isAvailable: { type: Boolean, default: true }, // Availability status
});

// Main Product Schema
const productSchema = new Schema<ProductDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Men", "Women", "Kids", "Footwear", "Accessories", "New Arrivals"],
      required: true,
    },
    subcategory: {
      type: [String],
      enum: Subcategories as unknown as string[],
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
    totalStock: { type: Number, required: true, min: 0, default: 0 }, // Total stock for the product
    cloudinaryPublicIds: { type: [String], default: [] }, // Store Cloudinary public IDs for deletion

    // SEO and metadata
    slug: { type: String, required: true, unique: true, lowercase: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: [{ type: String, trim: true }],

    // Detailed product information
    detailedDescription: { type: String },
    specifications: [specificationSchema],
    careInstructions: [{ type: String }],
    keyFeatures: [{ type: String }],
    material: { type: String },
    weight: { type: String },
    warranty: { type: String },
    origin: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual fields
productSchema.virtual("discountPercent").get(function () {
  if (this.variants && this.variants.length > 0) {
    // Calculate average discount across all variants
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

// totalStock is now a direct field, no virtual needed

productSchema.virtual("inStock").get(function () {
  return this.totalStock > 0;
});

// Pre-save middleware to generate slug
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

// Indexes for better performance
productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

// Mongoose Model
const Product = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
