import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";
import User from "../models/User";
import Product from "../models/ProductModal";
import { Order } from "../models/Order";
import Review from "../models/Review";
import { ReturnReplace } from "../models/ReturnReplace";

interface AdminRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, isActive: true });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    admin.lastLogin = new Date();
    await admin.save();

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
  } catch (error) {
    res.status(500).json({
      message: "Admin login failed",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = "", search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    console.log("🔍 Admin Orders Search Debug:", {
      search: search,
      status: status,
      page: page,
      limit: limit,
    });

    // Build query object
    const query: any = {};
    if (status) query.status = status;

    // Add search functionality
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: "i" } }, // Search by order ID
        { "user.username": { $regex: search, $options: "i" } }, // Search by username
        { "user.email": { $regex: search, $options: "i" } }, // Search by email
        { "shippingAddress.fullName": { $regex: search, $options: "i" } }, // Search by customer name
        { "items.product": { $regex: search, $options: "i" } }, // Search by product ID
      ];
    }

    console.log("🔍 MongoDB Query:", JSON.stringify(query, null, 2));

    let orders;
    if (search) {
      // For search, get all orders first, then filter and paginate
      const allOrders = await Order.find({})
        .populate("user", "username email")
        .populate("items.product", "title variants images")
        .sort({ createdAt: -1 });

      // Filter orders based on search criteria
      const filteredOrders = allOrders.filter((order) => {
        const searchLower = (search as string).toLowerCase();

        // Check order ID
        if (order._id.toString().toLowerCase().includes(searchLower))
          return true;

        // Check user info
        if (order.user && typeof order.user === "object") {
          if ((order.user as any).username?.toLowerCase().includes(searchLower))
            return true;
          if ((order.user as any).email?.toLowerCase().includes(searchLower))
            return true;
        }

        // Check shipping address
        if (
          order.shippingAddress?.fullName?.toLowerCase().includes(searchLower)
        )
          return true;

        // Check product titles
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            if (item.product && typeof item.product === "object") {
              if (
                (item.product as any).title?.toLowerCase().includes(searchLower)
              )
                return true;
            }
          }
        }

        return false;
      });

      // Apply pagination to filtered results
      orders = filteredOrders.slice(skip, skip + Number(limit));
    } else {
      // For non-search queries, use direct MongoDB query
      orders = await Order.find(query)
        .populate("user", "username email")
        .populate("items.product", "title variants images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    }

    // Process orders to extract correct variant data
    const processedOrders = orders.map((order) => {
      const processedItems = order.items.map((item) => {
        if (item.product && item.product.variants) {
          // Find the matching variant based on size and color
          const matchingVariant = item.product.variants.find(
            (variant) =>
              variant.size === item.size && variant.color === item.color
          );

          if (matchingVariant) {
            return {
              ...item.toObject(),
              product: {
                name: item.product.title,
                images: matchingVariant.images || item.product.images || [],
                price: matchingVariant.price,
              },
            };
          }
        }

        // Fallback if no matching variant found
        return {
          ...item.toObject(),
          product: {
            name: item.product?.title || "Product Name Not Available",
            images: item.product?.images || [],
            price: 0,
          },
        };
      });

      return {
        ...order.toObject(),
        items: processedItems,
      };
    });

    let total;
    if (search) {
      // For search, count filtered results
      const allOrders = await Order.find({})
        .populate("user", "username email")
        .populate("items.product", "title variants images");

      const filteredOrders = allOrders.filter((order) => {
        const searchLower = (search as string).toLowerCase();

        // Check order ID
        if (order._id.toString().toLowerCase().includes(searchLower))
          return true;

        // Check user info
        if (order.user && typeof order.user === "object") {
          if ((order.user as any).username?.toLowerCase().includes(searchLower))
            return true;
          if ((order.user as any).email?.toLowerCase().includes(searchLower))
            return true;
        }

        // Check shipping address
        if (
          order.shippingAddress?.fullName?.toLowerCase().includes(searchLower)
        )
          return true;

        // Check product titles
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            if (item.product && typeof item.product === "object") {
              if (
                (item.product as any).title?.toLowerCase().includes(searchLower)
              )
                return true;
            }
          }
        }

        return false;
      });

      total = filteredOrders.length;
    } else {
      // For non-search queries, use direct count
      total = await Order.countDocuments(query);
    }

    console.log("🔍 Search Results:", {
      searchQuery: search,
      totalResults: total,
      returnedOrders: processedOrders.length,
      orderIds: processedOrders.map((o) => o._id),
    });

    res.json({
      message: "Orders retrieved successfully",
      orders: processedOrders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error updating order status",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      status = "",
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

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
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { status },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product status updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({
      message: "Error updating product status",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find()
      .populate("user", "username email")
      .populate("product", "title variants")
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
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error deleting review",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getReturnReplaceRequests = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = status ? { status } : {};

    const requests = await ReturnReplace.find(query)
      .populate("user", "username email")
      .populate("order", "totalAmount status")
      .populate("items.product", "title variants")
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
  } catch (error) {
    res.status(500).json({
      message: "Error fetching return/replace requests",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error updating return/replace status",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    // Log the incoming data to debug
    console.log("Creating product with data:", {
      title: productData.title,
      brand: productData.brand,
      category: productData.category,
      variantsCount: productData.variants?.length || 0,
      cloudinaryPublicIdsCount: productData.cloudinaryPublicIds?.length || 0,
    });

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product",
      error: error instanceof Error ? error.message : error,
    });
  }
};

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
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const admins = await Admin.find({})
      .select("-password")
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

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, permissions } = req.body;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this username already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      role: role || "admin",
      permissions: permissions || [],
      isActive: true,
    });

    await newAdmin.save();

    const adminResponse = newAdmin.toObject();
    delete (adminResponse as any).password;

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

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { username, email, role, permissions, isActive } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

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

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (permissions) admin.permissions = permissions;
    if (typeof isActive === "boolean") admin.isActive = isActive;

    await admin.save();

    const adminResponse = admin.toObject();
    delete (adminResponse as any).password;

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

export const deleteAdmin = async (req: AdminRequest, res: Response) => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

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

    const adminResponse = admin.toObject();
    delete (adminResponse as any).password;

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

// Get payment settings
export const getPaymentSettings = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;
    console.log("🔍 Fetching payment settings for admin:", adminId);

    const admin = await Admin.findById(adminId).select("paymentSettings");

    if (!admin) {
      console.log("❌ Admin not found:", adminId);
      return res.status(404).json({ message: "Admin not found" });
    }

    console.log("🔍 Admin payment settings:", admin.paymentSettings);
    console.log(
      "🔍 QR Codes count:",
      admin.paymentSettings?.qrCodes?.length || 0
    );

    res.json({
      message: "Payment settings retrieved successfully",
      paymentSettings: admin.paymentSettings || {
        qrCodes: [],
      },
    });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    res.status(500).json({
      message: "Error fetching payment settings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Update payment settings
export const updatePaymentSettings = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;
    const { paymentSettings } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { paymentSettings },
      { new: true }
    ).select("paymentSettings");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Payment settings updated successfully",
      paymentSettings: admin.paymentSettings,
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res.status(500).json({
      message: "Error updating payment settings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Admin image upload
export const adminImageUpload = async (req: Request, res: Response) => {
  try {
    console.log("Admin upload - File received:", {
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

    // Validate file
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    // Import cloudinary upload function
    const { uploadToCloudinary } = await import("../utils/cloudinaryUpload");

    const result = await uploadToCloudinary(req.file, "manualfits/payment");

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        secure_url: result.url,
        public_id: result.public_id,
      });
    } else {
      console.error("Admin upload - Upload failed:", result.error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Admin upload - Error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get payment settings for order page (public endpoint)
export const getPublicPaymentSettings = async (req: Request, res: Response) => {
  try {
    // Get the first admin with payment settings
    const admin = await Admin.findOne({
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
  } catch (error) {
    console.error("Error fetching public payment settings:", error);
    res.status(500).json({
      message: "Error fetching payment settings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Get dashboard chart data
export const getDashboardChartData = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Get daily order and revenue data for the last 7 days
    const dailyData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: "delivered",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Generate chart data for the last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Find data for this date
      const dayData = dailyData.find(
        (d) =>
          d._id.year === date.getFullYear() &&
          d._id.month === date.getMonth() + 1 &&
          d._id.day === date.getDate()
      );

      chartData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        orders: dayData ? dayData.orders : 0,
        revenue: dayData ? dayData.revenue : 0,
      });
    }

    // Get monthly comparison data
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(currentMonth.getMonth() - 1);

    const [currentMonthData, lastMonthData] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                1
              ),
              $lt: new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              ),
            },
            status: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
              $lt: new Date(
                lastMonth.getFullYear(),
                lastMonth.getMonth() + 1,
                1
              ),
            },
            status: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const currentOrders =
      currentMonthData.length > 0 ? currentMonthData[0].orders : 0;
    const lastOrders = lastMonthData.length > 0 ? lastMonthData[0].orders : 0;
    const currentRevenue =
      currentMonthData.length > 0 ? currentMonthData[0].revenue : 0;
    const lastRevenue = lastMonthData.length > 0 ? lastMonthData[0].revenue : 0;

    // Calculate percentage changes
    const orderGrowth =
      lastOrders > 0 ? ((currentOrders - lastOrders) / lastOrders) * 100 : 0;
    const revenueGrowth =
      lastRevenue > 0
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : 0;

    res.json({
      message: "Chart data retrieved successfully",
      data: {
        chartData,
        comparison: {
          orderGrowth: Math.round(orderGrowth),
          revenueGrowth: Math.round(revenueGrowth),
          currentOrders,
          lastOrders,
          currentRevenue,
          lastRevenue,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({
      message: "Error fetching chart data",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Get admin profile
export const getAdminProfile = async (req: AdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id;

    if (!adminId) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    const admin = await Admin.findById(adminId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Admin profile retrieved successfully",
      admin,
    });
  } catch (error: any) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      message: "Error retrieving profile",
      error: error.message,
    });
  }
};

// Update admin profile
export const updateAdminProfile = async (req: AdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id;
    const { username, email } = req.body;

    if (!adminId) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    // Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if username is already taken by another admin
    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({
        username,
        _id: { $ne: adminId },
      });
      if (existingAdmin) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }
    }

    // Check if email is already taken by another admin
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({
        email,
        _id: { $ne: adminId },
      });
      if (existingAdmin) {
        return res.status(400).json({
          message: "Email already taken",
        });
      }
    }

    // Update admin fields
    if (username) admin.username = username;
    if (email) admin.email = email;

    admin.updatedAt = new Date();
    await admin.save();

    // Return updated admin (without password)
    const updatedAdmin = await Admin.findById(adminId).select("-password");

    res.json({
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error: any) {
    console.error("Update admin profile error:", error);
    res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
};
