import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  email?: string;
  password: string;
  role: "super_admin" | "admin" | "moderator";
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
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
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "moderator"],
      default: "admin",
    },
    permissions: [
      {
        type: String,
        enum: [
          // Users permissions
          "users.view",
          "users.edit",
          "users.delete",
          // Products permissions
          "products.view",
          "products.create",
          "products.edit",
          "products.delete",
          // Orders permissions
          "orders.view",
          "orders.edit",
          // Reviews permissions
          "reviews.view",
          "reviews.delete",
          // Returns permissions
          "returns.view",
          "returns.edit",
          // Admin permissions
          "admins.view",
          "admins.create",
          "admins.edit",
          "admins.delete",
        ],
      },
    ],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for efficient queries
AdminSchema.index({ isActive: 1 });

const Admin =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
