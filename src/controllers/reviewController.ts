import { Request, Response } from "express";
import Review from "../models/Review";
import { Order } from "../models/Order";
import User from "../models/User";
import mongoose from "mongoose";

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email?: string;
    profilePic?: string;
  };
}

// Helper function to get user from database
const getUserFromDatabase = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error("🔍 Error fetching user from database:", error);
    return null;
  }
};

// Get reviews for a specific product
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "username email image")
      .sort({ createdAt: -1 })
      .lean();

    const formattedReviews = reviews.map((review: any) => {
      const userData = {
        _id: review.user?._id || review.user,
        name: review.user?.username || "Unknown User",
        email: review.user?.email || "unknown@example.com",
        profilePic: review.user?.image,
      };

      const formattedReview = {
        _id: review._id,
        user: userData,
        product: review.product,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        likes: review.likes || [],
        likesCount: review.likesCount || 0,
        images: review.images || [],
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };

      return formattedReview;
    });

    res.json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("🔍 Error fetching product reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

// Create a new review
export const createReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { productId, rating, title, comment, images } = req.body;
    const userId = req.user?.id; // Assuming user is authenticated

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Check if user has purchased and received this product
    const order = await Order.findOne({
      user: new mongoose.Types.ObjectId(userId),
      "items.product": new mongoose.Types.ObjectId(productId),
      status: "delivered",
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "You can only review products you have purchased and received",
      });
    }

    const review = new Review({
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),
      rating,
      title,
      comment,
      verified: true, // Since they purchased it
      images: images || [],
      likes: [],
      likesCount: 0,
    });

    await review.save();

    // Populate user data for response
    await review.populate("user", "username email image");

    const userData = {
      _id: (review.user as any)?._id || review.user,
      name: (review.user as any)?.username || "Unknown User",
      email: (review.user as any)?.email || "unknown@example.com",
      profilePic: (review.user as any)?.image,
    };

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: {
        _id: review._id,
        user: userData,
        product: review.product,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        likes: review.likes || [],
        likesCount: review.likesCount || 0,
        images: review.images || [],
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};

// Update a review
export const updateReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to edit it",
      });
    }

    review.rating = rating;
    review.title = title;
    review.comment = comment;
    await review.save();

    // Populate user data for response
    await review.populate("user", "username email image");

    const userData = {
      _id: (review.user as any)?._id || review.user,
      name: (review.user as any)?.username || "Unknown User",
      email: (review.user as any)?.email || "unknown@example.com",
      profilePic: (review.user as any)?.image,
    };

    res.json({
      success: true,
      message: "Review updated successfully",
      review: {
        _id: review._id,
        user: userData,
        product: review.product,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        likes: review.likes || [],
        likesCount: review.likesCount || 0,
        images: review.images || [],
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

// Delete a review
export const deleteReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

// Check if user can review a product
export const checkUserCanReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        canReview: false,
        reason: "User not authenticated",
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      return res.json({
        canReview: false,
        reason: "You have already reviewed this product",
      });
    }

    // Check if user has purchased and received this product
    const order = await Order.findOne({
      user: new mongoose.Types.ObjectId(userId),
      "items.product": new mongoose.Types.ObjectId(productId),
      status: "delivered",
    });

    if (order) {
      console.log("Order found:", {
        orderId: order._id,
        status: order.status,
        itemsCount: order.items.length,
        items: order.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      });
    }

    if (!order) {
      return res.json({
        canReview: false,
        reason: "You can only review products you have purchased and received",
      });
    }

    res.json({
      canReview: true,
    });
  } catch (error) {
    console.error("🔍 Error checking review eligibility:", error);
    res.status(500).json({
      canReview: false,
      reason: "Unable to verify purchase status",
    });
  }
};

// Like/Unlike a review
export const toggleReviewLike = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const isLiked = review.likes.includes(new mongoose.Types.ObjectId(userId));

    if (isLiked) {
      // Unlike
      review.likes = review.likes.filter((like) => like.toString() !== userId);
      review.likesCount = Math.max(0, review.likesCount - 1);
    } else {
      // Like
      review.likes.push(new mongoose.Types.ObjectId(userId));
      review.likesCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: isLiked ? "Review unliked" : "Review liked",
      isLiked: !isLiked,
      likesCount: review.likesCount,
    });
  } catch (error) {
    console.error("Error toggling review like:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
};
