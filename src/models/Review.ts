import mongoose, { Schema, Document, Types } from "mongoose";

// Review Document Interface
export interface ReviewDocument extends Document {
  user: Types.ObjectId; // Reference to User
  product: Types.ObjectId; // Reference to Product
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  likes: Types.ObjectId[]; // Users who liked this review
  likesCount: number;
  images?: string[]; // Review images
  createdAt: Date;
  updatedAt: Date;
}

// Review Schema
const reviewSchema = new Schema<ReviewDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    verified: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    images: [{ type: String }], // Cloudinary URLs for review images
  },
  { timestamps: true }
);

// Index for efficient queries
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ createdAt: -1 });

// Mongoose Model
const Review = mongoose.model<ReviewDocument>("Review", reviewSchema);

export default Review;
