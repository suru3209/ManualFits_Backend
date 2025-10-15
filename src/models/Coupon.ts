import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usagePerUser?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdBy: string; // Admin ID
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usagePerUser: {
      type: Number,
      min: 1,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
    applicableCategories: [
      {
        type: String,
        enum: [
          "Men",
          "Women",
          "Kids",
          "Footwear",
          "Accessories",
          "New Arrivals",
        ],
      },
    ],
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    } as any,
  },
  { timestamps: true }
);

// Indexes
CouponSchema.index({ validFrom: 1, validTo: 1 });
CouponSchema.index({ isActive: 1 });

export default mongoose.models.Coupon ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);
