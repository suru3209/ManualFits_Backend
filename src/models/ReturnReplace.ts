import { Schema, model, Document, Types } from "mongoose";

export interface IReturnReplace extends Document {
  order: Types.ObjectId; // kaunse order se request aayi
  user: Types.ObjectId; // kaun request kar raha
  items: {
    product: Types.ObjectId;
    reason: string;
    quantity: number;
  }[];
  type: "return" | "replace"; // return ya replace
  status: "requested" | "approved" | "rejected" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
}

const ReturnReplaceItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    reason: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const ReturnReplaceSchema = new Schema<IReturnReplace>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [ReturnReplaceItemSchema],
    type: { type: String, enum: ["return", "replace"], required: true },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "completed"],
      default: "requested",
    },
  },
  { timestamps: true }
);

export const ReturnReplace = model<IReturnReplace>(
  "ReturnReplace",
  ReturnReplaceSchema
);
