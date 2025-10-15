"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicPaymentSettings = exports.adminImageUpload = exports.updatePaymentSettings = exports.getPaymentSettings = exports.updateAdminPermissions = exports.getPermissions = exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.getAllAdmins = exports.deleteProduct = exports.getProduct = exports.updateProduct = exports.createProduct = exports.updateReturnReplaceStatus = exports.getReturnReplaceRequests = exports.deleteReview = exports.getAllReviews = exports.updateProductStatus = exports.getAllProducts = exports.updateOrderStatus = exports.getAllOrders = exports.getAllUsers = exports.getDashboardStats = exports.adminLogin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = __importDefault(require("../models/Admin"));
const User_1 = __importDefault(require("../models/User"));
const ProductModal_1 = __importDefault(require("../models/ProductModal"));
const Order_1 = require("../models/Order");
const Review_1 = __importDefault(require("../models/Review"));
const ReturnReplace_1 = require("../models/ReturnReplace");
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin_1.default.findOne({ username, isActive: true });
        if (!admin) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt_1.default.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        admin.lastLogin = new Date();
        await admin.save();
        const token = jsonwebtoken_1.default.sign({
            id: admin._id,
            username: admin.username,
            role: admin.role,
            permissions: admin.permissions,
        }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.json({
            message: "Admin login successful",
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role,
                permissions: admin.permissions,
                lastLogin: admin.lastLogin,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Admin login failed",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.adminLogin = adminLogin;
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalProducts, totalOrders, totalReviews, pendingOrders, completedOrders, totalRevenue, recentOrders,] = await Promise.all([
            User_1.default.countDocuments(),
            ProductModal_1.default.countDocuments(),
            Order_1.Order.countDocuments(),
            Review_1.default.countDocuments(),
            Order_1.Order.countDocuments({ status: "pending" }),
            Order_1.Order.countDocuments({ status: "delivered" }),
            Order_1.Order.aggregate([
                { $match: { status: "delivered" } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            ]),
            Order_1.Order.find()
                .populate("user", "username email")
                .populate("items.product", "title variants")
                .sort({ createdAt: -1 })
                .limit(10),
        ]);
        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
        res.json({
            message: "Dashboard stats retrieved successfully",
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalReviews,
                pendingOrders,
                completedOrders,
                totalRevenue: revenue,
                recentOrders,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching dashboard stats",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = search
            ? {
                $or: [
                    { username: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            }
            : {};
        const users = await User_1.default.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await User_1.default.countDocuments(query);
        res.json({
            message: "Users retrieved successfully",
            users,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching users",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getAllUsers = getAllUsers;
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = status ? { status } : {};
        const orders = await Order_1.Order.find(query)
            .populate("user", "username email")
            .populate("items.product", "title variants")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Order_1.Order.countDocuments(query);
        res.json({
            message: "Orders retrieved successfully",
            orders,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching orders",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getAllOrders = getAllOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order_1.Order.findByIdAndUpdate(orderId, { status }, { new: true }).populate("user", "username email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({
            message: "Order status updated successfully",
            order,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating order status",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", category = "", status = "", } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
            ];
        }
        if (category) {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }
        const products = await ProductModal_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await ProductModal_1.default.countDocuments(query);
        res.json({
            message: "Products retrieved successfully",
            products,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching products",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getAllProducts = getAllProducts;
const updateProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const { status } = req.body;
        const product = await ProductModal_1.default.findByIdAndUpdate(productId, { status }, { new: true });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({
            message: "Product status updated successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error updating product status:", error);
        res.status(500).json({
            message: "Error updating product status",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateProductStatus = updateProductStatus;
const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const reviews = await Review_1.default.find()
            .populate("user", "username email")
            .populate("product", "title variants")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Review_1.default.countDocuments();
        res.json({
            message: "Reviews retrieved successfully",
            reviews,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching reviews",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getAllReviews = getAllReviews;
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review_1.default.findByIdAndDelete(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        res.json({
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error deleting review",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteReview = deleteReview;
const getReturnReplaceRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = status ? { status } : {};
        const requests = await ReturnReplace_1.ReturnReplace.find(query)
            .populate("user", "username email")
            .populate("order", "totalAmount status")
            .populate("items.product", "title variants")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await ReturnReplace_1.ReturnReplace.countDocuments(query);
        res.json({
            message: "Return/Replace requests retrieved successfully",
            requests,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching return/replace requests",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getReturnReplaceRequests = getReturnReplaceRequests;
const updateReturnReplaceStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const request = await ReturnReplace_1.ReturnReplace.findByIdAndUpdate(requestId, { status }, { new: true }).populate("user", "username email");
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        res.json({
            message: "Return/Replace status updated successfully",
            request,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating return/replace status",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateReturnReplaceStatus = updateReturnReplaceStatus;
const createProduct = async (req, res) => {
    try {
        const productData = req.body;
            title: productData.title,
            brand: productData.brand,
            category: productData.category,
            variantsCount: productData.variants?.length || 0,
            cloudinaryPublicIdsCount: productData.cloudinaryPublicIds?.length || 0,
        });
        const product = new ProductModal_1.default(productData);
        await product.save();
        res.status(201).json({
            message: "Product created successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            message: "Error creating product",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;
        const product = await ProductModal_1.default.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({
            message: "Product updated successfully",
            product,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating product",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateProduct = updateProduct;
const getProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await ProductModal_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({
            message: "Product retrieved successfully",
            product,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching product",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getProduct = getProduct;
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await ProductModal_1.default.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error deleting product",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteProduct = deleteProduct;
const getAllAdmins = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const admins = await Admin_1.default.find({})
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Admin_1.default.countDocuments({});
        res.json({
            message: "Admins fetched successfully",
            admins,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    }
    catch (error) {
        console.error("Error fetching admins:", error);
        res.status(500).json({
            message: "Error fetching admins",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getAllAdmins = getAllAdmins;
const createAdmin = async (req, res) => {
    try {
        const { username, email, password, role, permissions } = req.body;
        const existingAdmin = await Admin_1.default.findOne({ username });
        if (existingAdmin) {
            return res
                .status(400)
                .json({ message: "Admin with this username already exists" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const newAdmin = new Admin_1.default({
            username,
            email,
            password: hashedPassword,
            role: role || "admin",
            permissions: permissions || [],
            isActive: true,
        });
        await newAdmin.save();
        const adminResponse = newAdmin.toObject();
        delete adminResponse.password;
        res.status(201).json({
            message: "Admin created successfully",
            admin: adminResponse,
        });
    }
    catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({
            message: "Error creating admin",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.createAdmin = createAdmin;
const updateAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { username, email, role, permissions, isActive } = req.body;
        const admin = await Admin_1.default.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        if (username && username !== admin.username) {
            const existingAdmin = await Admin_1.default.findOne({
                username,
                _id: { $ne: adminId },
            });
            if (existingAdmin) {
                return res
                    .status(400)
                    .json({ message: "Admin with this username already exists" });
            }
        }
        if (username)
            admin.username = username;
        if (email)
            admin.email = email;
        if (role)
            admin.role = role;
        if (permissions)
            admin.permissions = permissions;
        if (typeof isActive === "boolean")
            admin.isActive = isActive;
        await admin.save();
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        res.json({
            message: "Admin updated successfully",
            admin: adminResponse,
        });
    }
    catch (error) {
        console.error("Error updating admin:", error);
        res.status(500).json({
            message: "Error updating admin",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateAdmin = updateAdmin;
const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await Admin_1.default.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        if (admin._id.toString() === req.admin?.id) {
            return res
                .status(400)
                .json({ message: "Cannot delete your own account" });
        }
        await Admin_1.default.findByIdAndDelete(adminId);
        res.json({
            message: "Admin deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting admin:", error);
        res.status(500).json({
            message: "Error deleting admin",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.deleteAdmin = deleteAdmin;
const getPermissions = async (req, res) => {
    try {
        const permissions = [
            {
                id: "users.view",
                name: "View Users",
                description: "View user list and details",
                category: "Users",
            },
            {
                id: "users.edit",
                name: "Edit Users",
                description: "Edit user information",
                category: "Users",
            },
            {
                id: "users.delete",
                name: "Delete Users",
                description: "Delete user accounts",
                category: "Users",
            },
            {
                id: "products.view",
                name: "View Products",
                description: "View product list and details",
                category: "Products",
            },
            {
                id: "products.create",
                name: "Create Products",
                description: "Create new products",
                category: "Products",
            },
            {
                id: "products.edit",
                name: "Edit Products",
                description: "Edit product information",
                category: "Products",
            },
            {
                id: "products.delete",
                name: "Delete Products",
                description: "Delete products",
                category: "Products",
            },
            {
                id: "orders.view",
                name: "View Orders",
                description: "View order list and details",
                category: "Orders",
            },
            {
                id: "orders.edit",
                name: "Edit Orders",
                description: "Update order status",
                category: "Orders",
            },
            {
                id: "reviews.view",
                name: "View Reviews",
                description: "View product reviews",
                category: "Reviews",
            },
            {
                id: "reviews.delete",
                name: "Delete Reviews",
                description: "Delete product reviews",
                category: "Reviews",
            },
            {
                id: "returns.view",
                name: "View Returns",
                description: "View return/replace requests",
                category: "Returns",
            },
            {
                id: "returns.edit",
                name: "Edit Returns",
                description: "Process return/replace requests",
                category: "Returns",
            },
            {
                id: "admins.view",
                name: "View Admins",
                description: "View admin list",
                category: "Admins",
            },
            {
                id: "admins.create",
                name: "Create Admins",
                description: "Create new admin accounts",
                category: "Admins",
            },
            {
                id: "admins.edit",
                name: "Edit Admins",
                description: "Edit admin information",
                category: "Admins",
            },
            {
                id: "admins.delete",
                name: "Delete Admins",
                description: "Delete admin accounts",
                category: "Admins",
            },
        ];
        res.json({
            message: "Permissions fetched successfully",
            permissions,
        });
    }
    catch (error) {
        console.error("Error fetching permissions:", error);
        res.status(500).json({
            message: "Error fetching permissions",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getPermissions = getPermissions;
const updateAdminPermissions = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { permissions } = req.body;
        const admin = await Admin_1.default.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        admin.permissions = permissions;
        await admin.save();
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        res.json({
            message: "Admin permissions updated successfully",
            admin: adminResponse,
        });
    }
    catch (error) {
        console.error("Error updating admin permissions:", error);
        res.status(500).json({
            message: "Error updating admin permissions",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updateAdminPermissions = updateAdminPermissions;
const getPaymentSettings = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const admin = await Admin_1.default.findById(adminId).select("paymentSettings");
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.json({
            message: "Payment settings retrieved successfully",
            paymentSettings: admin.paymentSettings || {
                qrCodes: [],
            },
        });
    }
    catch (error) {
        console.error("Error fetching payment settings:", error);
        res.status(500).json({
            message: "Error fetching payment settings",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getPaymentSettings = getPaymentSettings;
const updatePaymentSettings = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { paymentSettings } = req.body;
        const admin = await Admin_1.default.findByIdAndUpdate(adminId, { paymentSettings }, { new: true }).select("paymentSettings");
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.json({
            message: "Payment settings updated successfully",
            paymentSettings: admin.paymentSettings,
        });
    }
    catch (error) {
        console.error("Error updating payment settings:", error);
        res.status(500).json({
            message: "Error updating payment settings",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.updatePaymentSettings = updatePaymentSettings;
const adminImageUpload = async (req, res) => {
    try {
            hasFile: !!req.file,
            fileSize: req.file?.size,
            fileType: req.file?.mimetype,
            fileName: req.file?.originalname,
        });
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }
        if (!req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({
                success: false,
                message: "Only image files are allowed",
            });
        }
        const { uploadToCloudinary } = await Promise.resolve().then(() => __importStar(require("../utils/cloudinaryUpload")));
        const result = await uploadToCloudinary(req.file, "manualfits/payment");
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Image uploaded successfully",
                secure_url: result.url,
                public_id: result.public_id,
            });
        }
        else {
            console.error("Admin upload - Upload failed:", result.error);
            res.status(500).json({
                success: false,
                message: "Upload failed",
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Admin upload - Error:", error);
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.adminImageUpload = adminImageUpload;
const getPublicPaymentSettings = async (req, res) => {
    try {
        const admin = await Admin_1.default.findOne({
            paymentSettings: { $exists: true, $ne: null },
        }).select("paymentSettings");
        if (!admin || !admin.paymentSettings) {
            return res.status(404).json({
                message: "Payment settings not found",
                paymentSettings: null,
            });
        }
        res.json({
            message: "Payment settings retrieved successfully",
            paymentSettings: {
                qrCodes: admin.paymentSettings.qrCodes || [],
            },
        });
    }
    catch (error) {
        console.error("Error fetching public payment settings:", error);
        res.status(500).json({
            message: "Error fetching payment settings",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.getPublicPaymentSettings = getPublicPaymentSettings;
