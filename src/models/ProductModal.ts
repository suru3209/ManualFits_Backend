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

// Product Document Interface
export interface ProductDocument extends Document {
  name: string;
  price: number;
  originalPrice: number;
  images: string[]; // Cloudinary URLs - first = default, second = hover
  cloudinaryPublicIds?: string[]; // Store Cloudinary public IDs for deletion
  category:
    | "Men"
    | "Women"
    | "Kids"
    | "Footwear"
    | "Accessories"
    | "New Arrivals";
  subcategory: Subcategory[];
  colors: string[];
  sizes: { size: string; stock: number }[];

  slug: string;
  totalStock: number;
  status: "active" | "draft" | "archived";
  discountType: "percentage" | "flat";
  discount: number;
  discountEnd?: Date;
  inStock: boolean;
  rating: number;
  reviews: number;
  brand: string;
  description: string;
  tags?: string[];
  sku?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  variants?: {
    color: string;
    images: string[];
    sizes: { size: string; stock: number }[];
  }[];
  // New detailed fields
  detailedDescription?: string;
  specifications?: Specification[];
  careInstructions?: string[];
  keyFeatures?: string[];
  material?: string;
  weight?: string;
  warranty?: string;
  origin?: string;
}

// Specification Schema
const specificationSchema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

// Mongoose Schema
const productSchema = new Schema<ProductDocument>(
  {
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
      enum: Subcategories as unknown as string[], // enforce enum from array
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
    // New detailed fields
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
  },
  { timestamps: true }
);

// Mongoose Model
const Product = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
