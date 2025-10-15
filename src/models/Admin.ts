import mongoose, { Schema, Document } from "mongoose";

export interface QRCodeDetails {
  imageUrl: string;
  upiId: string;
  upiName: string;
}

export interface PaymentSettings {
  qrCodes: QRCodeDetails[];
}

export interface IAdmin extends Document {
  username: string;
  email?: string;
  password: string;
  role: "super_admin" | "admin" | "moderator" | "viewer";
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
  paymentSettings?: PaymentSettings;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "moderator", "viewer"],
      default: "admin",
    },
    permissions: [
      {
        type: String,
        enum: [
          "products.create",
          "products.read",
          "products.update",
          "products.delete",
          "orders.read",
          "orders.update",
          "users.read",
          "users.update",
          "users.delete",
          "reviews.read",
          "reviews.update",
          "reviews.delete",
          "coupons.create",
          "coupons.read",
          "coupons.update",
          "coupons.delete",
          "analytics.read",
          "settings.read",
          "settings.update",
          "admins.create",
          "admins.read",
          "admins.update",
          "admins.delete",
          "support.view",
          "support.create",
          "support.update",
          "support.delete",
          "*",
        ],
      },
    ],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    paymentSettings: {
      qrCodes: [
        {
          imageUrl: { type: String, required: true },
          upiId: { type: String, required: true },
          upiName: { type: String, required: true },
        },
      ],
    },
  },
  { timestamps: true }
);

AdminSchema.index({ isActive: 1 });

export default mongoose.models.Admin ||
  mongoose.model<IAdmin>("Admin", AdminSchema);
