"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.getCoupon = exports.createCoupon = exports.getAllCoupons = void 0;
const Coupon_1 = __importDefault(require("../models/Coupon"));
const getAllCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", status = "", type = "", } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = {};
        if (search) {
            query.code = { $regex: search, $options: "i" };
        }
        if (type) {
            query.type = type;
        }
        if (status) {
            const now = new Date();
            switch (status) {
                case "active":
                    query.isActive = true;
                    query.validFrom = { $lte: now };
                    query.validTo = { $gte: now };
                    break;
                case "inactive":
                    query.isActive = false;
                    break;
                case "expired":
                    query.validTo = { $lt: now };
                    break;
                case "upcoming":
                    query.validFrom = { $gt: now };
                    break;
            }
        }
        const coupons = await Coupon_1.default.find(query)
            .populate("createdBy", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Coupon_1.default.countDocuments(query);
        res.json({
            message: "Coupons retrieved successfully",
            coupons,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    }
    catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({
            message: "Error fetching coupons",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getAllCoupons = getAllCoupons;
const createCoupon = async (req, res) => {
    try {
        const couponData = {
            ...req.body,
            createdBy: req.admin?.id,
        };
        const coupon = new Coupon_1.default(couponData);
        await coupon.save();
        res.status(201).json({
            message: "Coupon created successfully",
            coupon,
        });
    }
    catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({
            message: "Error creating coupon",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.createCoupon = createCoupon;
const getCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const coupon = await Coupon_1.default.findById(couponId).populate("createdBy", "username");
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.json({
            message: "Coupon retrieved successfully",
            coupon,
        });
    }
    catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({
            message: "Error fetching coupon",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getCoupon = getCoupon;
const updateCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const updateData = req.body;
        const coupon = await Coupon_1.default.findByIdAndUpdate(couponId, updateData, {
            new: true,
            runValidators: true,
        }).populate("createdBy", "username");
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.json({
            message: "Coupon updated successfully",
            coupon,
        });
    }
    catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({
            message: "Error updating coupon",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateCoupon = updateCoupon;
const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const coupon = await Coupon_1.default.findByIdAndDelete(couponId);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.json({
            message: "Coupon deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({
            message: "Error deleting coupon",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteCoupon = deleteCoupon;
const validateCoupon = async (req, res) => {
    try {
        const { code, userId } = req.body;
        if (!code) {
            return res.status(400).json({ message: "Coupon code is required" });
        }
        const coupon = await Coupon_1.default.findOne({
            code: code.toUpperCase(),
            isActive: true,
        });
        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validTo) {
            return res
                .status(400)
                .json({ message: "Coupon is not valid at this time" });
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "Coupon usage limit exceeded" });
        }
        res.json({
            message: "Coupon is valid",
            coupon: {
                id: coupon._id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                minOrderValue: coupon.minOrderValue,
                usagePerUser: coupon.usagePerUser,
            },
        });
    }
    catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({
            message: "Error validating coupon",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.validateCoupon = validateCoupon;
