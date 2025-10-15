import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReturnReplaceItem {
  product: Types.ObjectId;
  reason: string;
  quantity: number;
}

export interface IReturnReplace extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  items: IReturnReplaceItem[];
  type: "return" | "replace";
  status: "requested" | "approved" | "rejected" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const ReturnReplaceItemSchema = new Schema<IReturnReplaceItem>(
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

export const ReturnReplace = mongoose.model<IReturnReplace>(
  "ReturnReplace",
  ReturnReplaceSchema
);
export default ReturnReplace;
