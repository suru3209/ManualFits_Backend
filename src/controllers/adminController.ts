import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";
import User from "../models/User";
import Product from "../models/ProductModal";
import { Order } from "../models/Order";
import Review from "../models/Review";
import { ReturnReplace } from "../models/ReturnReplace";

// Admin Login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

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
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Admin login failed", error: error.message });
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalReviews,
      pendingOrders,
      completedOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "delivered" }),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find()
        .populate("user", "username email")
        .populate("items.product", "name images")
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
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
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

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      message: "Users retrieved successfully",
      users,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get All Orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate("user", "username email")
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      message: "Orders retrieved successfully",
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// Update Order Status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("user", "username email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Get All Products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = "", category = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      message: "Products retrieved successfully",
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// Update Product Status
export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    console.log("Updating product status:", { productId, status });

    const product = await Product.findByIdAndUpdate(
      productId,
      { status },
      { new: true }
    );

    if (!product) {
      console.log("Product not found:", productId);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Product status updated successfully:", product.status);
    res.json({
      message: "Product status updated successfully",
      product,
    });
  } catch (error: any) {
    console.error("Error updating product status:", error);
    res
      .status(500)
      .json({ message: "Error updating product status", error: error.message });
  }
};

// Get All Reviews
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find()
      .populate("user", "username email")
      .populate("product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments();

    res.json({
      message: "Reviews retrieved successfully",
      reviews,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

// Delete Review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
};

// Get Return/Replace Requests
export const getReturnReplaceRequests = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = status ? { status } : {};

    const requests = await ReturnReplace.find(query)
      .populate("user", "username email")
      .populate("order", "totalAmount status")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ReturnReplace.countDocuments(query);

    res.json({
      message: "Return/Replace requests retrieved successfully",
      requests,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching return/replace requests",
      error: error.message,
    });
  }
};

// Update Return/Replace Status
export const updateReturnReplaceStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const request = await ReturnReplace.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    ).populate("user", "username email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json({
      message: "Return/Replace status updated successfully",
      request,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error updating return/replace status",
      error: error.message,
    });
  }
};

// Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    // Create new product
    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(productId, updateData, {
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
  } catch (error: any) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Get Single Product
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product retrieved successfully",
      product,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Admin Management Functions

// Get all admins
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const admins = await Admin.find({})
      .select("-password") // Exclude password from response
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Admin.countDocuments({});

    res.json({
      message: "Admins fetched successfully",
      admins,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({
      message: "Error fetching admins",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Create new admin
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, permissions } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this username already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      role: role || "admin",
      permissions: permissions || [],
      isActive: true,
    });

    await newAdmin.save();

    // Return admin without password
    const adminResponse = newAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      message: "Admin created successfully",
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      message: "Error creating admin",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Update admin
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { username, email, role, isActive } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({
        username,
        _id: { $ne: adminId },
      });
      if (existingAdmin) {
        return res
          .status(400)
          .json({ message: "Admin with this username already exists" });
      }
    }

    // Update admin fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (typeof isActive === "boolean") admin.isActive = isActive;

    await admin.save();

    // Return admin without password
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.json({
      message: "Admin updated successfully",
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({
      message: "Error updating admin",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Delete admin
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent deleting the current admin
    if (admin._id.toString() === req.admin?.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await Admin.findByIdAndDelete(adminId);

    res.json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({
      message: "Error deleting admin",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Get available permissions
export const getPermissions = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({
      message: "Error fetching permissions",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Update admin permissions
export const updateAdminPermissions = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.permissions = permissions;
    await admin.save();

    // Return admin without password
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.json({
      message: "Admin permissions updated successfully",
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Error updating admin permissions:", error);
    res.status(500).json({
      message: "Error updating admin permissions",
      error: error instanceof Error ? error.message : error,
    });
  }
};
