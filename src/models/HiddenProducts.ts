import mongoose, { Schema, Document } from "mongoose";

export interface IHiddenProducts extends Document {
  productNames: string[];
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const HiddenProductsSchema = new Schema<IHiddenProducts>(
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

HiddenProductsSchema.index({}, { unique: true });

export default mongoose.model<IHiddenProducts>(
  "HiddenProducts",
  HiddenProductsSchema
);
