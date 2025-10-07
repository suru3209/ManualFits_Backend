import mongoose, { Schema, Document } from "mongoose";

// Hidden Products Document Interface
export interface HiddenProductsDocument extends Document {
  productNames: string[];
  updatedAt: Date;
  updatedBy: string; // Admin ID who updated the list
}

// Hidden Products Schema
const HiddenProductsSchema = new Schema<HiddenProductsDocument>(
  {
    productNames: {
      type: [String],
      default: [],
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a singleton document - only one hidden products list
HiddenProductsSchema.index({}, { unique: true });

const HiddenProducts = mongoose.model<HiddenProductsDocument>(
  "HiddenProducts",
  HiddenProductsSchema
);

export default HiddenProducts;
