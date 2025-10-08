import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  corsMiddleware,
  corsPreflightHandler,
  securityHeaders,
  requestLogger,
} from "./middleware/corsMiddleware";
import Product from "./models/ProductModal";
import HiddenProducts from "./models/HiddenProducts";
import authRoutes from "./routes/authRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import userRoutes from "./routes/userRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import adminRoutes from "./routes/adminRoutes";
import chatRoutes from "./routes/chatRoutes";
import { SocketHandler } from "./socket/socketHandler";

dotenv.config();

// Set JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your-secret-key-here";
  console.log(
    "⚠️  JWT_SECRET not found, using default. Please set JWT_SECRET in .env file"
  );
}

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new SocketIOServer(server, {
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      "https://manual-fits-frontend-x94h.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handler
const socketHandler = new SocketHandler(io);
// Middleware setup
app.use(requestLogger);
app.use(corsPreflightHandler); // Handle preflight requests first
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user/cart", cartRoutes);
app.use("/api/user/wishlist", wishlistRoutes);
app.use("/api/user/address", addressRoutes);
app.use("/api/user/orders", orderRoutes);
app.use("/api/user", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

// MongoDB connection with better error handling and timeout settings
mongoose
  .connect(process.env.MONGO_URI || "", {
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds timeout
    connectTimeoutMS: 30000, // 30 seconds timeout
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  })
  .then(() => {
    console.log("✅ MongoDB Connected successfully");
    console.log("📊 Database state:", mongoose.connection.readyState);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    console.log(
      "🔍 Connection string:",
      process.env.MONGO_URI ? "Present" : "Missing"
    );
  });

// MongoDB connection event listeners
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected from MongoDB Atlas");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed through app termination");
  process.exit(0);
});

// Get all products endpoint
app.get("/products", async (req, res) => {
  try {
    // Get list of hidden product names
    const hiddenProductsDoc = await HiddenProducts.findOne();
    const hiddenProductNames = hiddenProductsDoc?.productNames || [];

    // Fetch all products except those in hidden list
    const products = await Product.find({
      name: { $nin: hiddenProductNames },
    });

    console.log(
      `✅ Found ${products.length} products (${hiddenProductNames.length} hidden)`
    );

    res.status(200).json({
      message: "Products fetched successfully",
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({
      message: "Error fetching products",
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Get single product endpoint
app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get list of hidden product names
    const hiddenProductsDoc = await HiddenProducts.findOne();
    const hiddenProductNames = hiddenProductsDoc?.productNames || [];

    // Find product and check if it's not in hidden list
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Check if product is hidden
    if (hiddenProductNames.includes(product.name)) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({
      message: "Error fetching product",
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
);

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Manual Fits Backend is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Cloudinary test endpoint
app.get("/test-cloudinary", async (req, res) => {
  try {
    const cloudinary = require("./config/cloudinary").default;
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      message: "Cloudinary connection successful",
      cloudinary: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cloudinary connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test upload endpoint (for debugging)
app.post("/test-upload", async (req, res) => {
  try {
    const {
      uploadSingleMiddleware,
    } = require("./controllers/uploadController");

    // Use multer middleware to handle the upload
    uploadSingleMiddleware(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "Upload middleware error",
          error: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      const { uploadToCloudinary } = require("./utils/cloudinaryUpload");
      const result = await uploadToCloudinary(req.file, "manualfits/test");

      if (result.success) {
        res.json({
          success: true,
          message: "Test upload successful",
          data: {
            url: result.url,
            public_id: result.public_id,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Upload failed",
          error: result.error,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Test upload error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io server initialized`);
});
