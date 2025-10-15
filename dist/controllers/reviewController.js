"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleReviewLike = exports.checkUserCanReview = exports.deleteReview = exports.updateReview = exports.createReview = exports.getProductReviews = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const Order_1 = require("../models/Order");
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const getUserFromDatabase = async (userId) => {
    try {
        const user = await User_1.default.findById(userId);
        return user;
    }
    catch (error) {
        console.error("🔍 Error fetching user from database:", error);
        return null;
    }
};
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review_1.default.find({ product: productId })
            .populate("user", "username email image")
            .sort({ createdAt: -1 })
            .lean();
        const formattedReviews = reviews.map((review) => {
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
                _id: formattedReview.user._id,
                name: formattedReview.user.name,
                email: formattedReview.user.email,
                profilePic: formattedReview.user.profilePic,
            });
            return formattedReview;
        });
        res.json({
            success: true,
            reviews: formattedReviews,
        });
    }
    catch (error) {
        console.error("🔍 Error fetching product reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
        });
    }
};
exports.getProductReviews = getProductReviews;
const createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment, images } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        const existingReview = await Review_1.default.findOne({
            user: userId,
            product: productId,
        });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product",
            });
        }
        const order = await Order_1.Order.findOne({
            user: new mongoose_1.default.Types.ObjectId(userId),
            "items.product": new mongoose_1.default.Types.ObjectId(productId),
            status: "delivered",
        });
        if (!order) {
            return res.status(400).json({
                success: false,
                message: "You can only review products you have purchased and received",
            });
        }
        const review = new Review_1.default({
            user: new mongoose_1.default.Types.ObjectId(userId),
            product: new mongoose_1.default.Types.ObjectId(productId),
            rating,
            title,
            comment,
            verified: true,
            images: images || [],
            likes: [],
            likesCount: 0,
        });
        await review.save();
        await review.populate("user", "username email image");
        const userData = {
            _id: review.user?._id || review.user,
            name: review.user?.username || "Unknown User",
            email: review.user?.email || "unknown@example.com",
            profilePic: review.user?.image,
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
    }
    catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create review",
        });
    }
};
exports.createReview = createReview;
const updateReview = async (req, res) => {
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
        const review = await Review_1.default.findOne({ _id: reviewId, user: userId });
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
        await review.populate("user", "username email image");
        const userData = {
            _id: review.user?._id || review.user,
            name: review.user?.username || "Unknown User",
            email: review.user?.email || "unknown@example.com",
            profilePic: review.user?.image,
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
    }
    catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update review",
        });
    }
};
exports.updateReview = updateReview;
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        const review = await Review_1.default.findOne({ _id: reviewId, user: userId });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to delete it",
            });
        }
        await Review_1.default.findByIdAndDelete(reviewId);
        res.json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
        });
    }
};
exports.deleteReview = deleteReview;
const checkUserCanReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.json({
                canReview: false,
                reason: "User not authenticated",
            });
        }
        const existingReview = await Review_1.default.findOne({
            user: userId,
            product: productId,
        });
        if (existingReview) {
            return res.json({
                canReview: false,
                reason: "You have already reviewed this product",
            });
        }
        const order = await Order_1.Order.findOne({
            user: new mongoose_1.default.Types.ObjectId(userId),
            "items.product": new mongoose_1.default.Types.ObjectId(productId),
            status: "delivered",
        });
        if (order) {
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
    }
    catch (error) {
        console.error("🔍 Error checking review eligibility:", error);
        res.status(500).json({
            canReview: false,
            reason: "Unable to verify purchase status",
        });
    }
};
exports.checkUserCanReview = checkUserCanReview;
const toggleReviewLike = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        const review = await Review_1.default.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }
        const isLiked = review.likes.includes(new mongoose_1.default.Types.ObjectId(userId));
        if (isLiked) {
            review.likes = review.likes.filter((like) => like.toString() !== userId);
            review.likesCount = Math.max(0, review.likesCount - 1);
        }
        else {
            review.likes.push(new mongoose_1.default.Types.ObjectId(userId));
            review.likesCount += 1;
        }
        await review.save();
        res.json({
            success: true,
            message: isLiked ? "Review unliked" : "Review liked",
            isLiked: !isLiked,
            likesCount: review.likesCount,
        });
    }
    catch (error) {
        console.error("Error toggling review like:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle like",
        });
    }
};
exports.toggleReviewLike = toggleReviewLike;
