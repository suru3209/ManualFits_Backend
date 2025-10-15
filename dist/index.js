"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const corsMiddleware_1 = require("./middleware/corsMiddleware");
const ProductModal_1 = __importDefault(require("./models/ProductModal"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/addressRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const supportRoutes_1 = __importDefault(require("./routes/supportRoutes"));
const couponRoutes_1 = __importDefault(require("./routes/couponRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const productVariantRoutes_1 = __importDefault(require("./routes/productVariantRoutes"));
const socketHandler_1 = require("./socket/socketHandler");
const autoReplyService_1 = require("./utils/autoReplyService");
const supportController_1 = require("./controllers/supportController");
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "your-secret-key-here";
    console.log("⚠️  JWT_SECRET not found, using default. Please set JWT_SECRET in .env file");
}
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || "https://manualfits.com",
            "https://www.manualfits.com",
            "https://manual-fits-frontend-x94h.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001",
            "https://manualfits.vercel.app",
            "https://manualfits-git-main-surya3209.vercel.app",
            "https://manualfits-git-develop-surya3209.vercel.app",
        ],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
const socketHandler = new socketHandler_1.SocketHandler(io);
(0, supportController_1.setSocketInstance)(io);
app.use(corsMiddleware_1.requestLogger);
app.use(corsMiddleware_1.simpleCors);
app.use(corsMiddleware_1.securityHeaders);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/user/cart", cartRoutes_1.default);
app.use("/api/user/wishlist", wishlistRoutes_1.default);
app.use("/api/user/address", addressRoutes_1.default);
app.use("/api/user/orders", orderRoutes_1.default);
app.use("/api/user", paymentRoutes_1.default);
app.use("/api/upload", uploadRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/admin/coupons", couponRoutes_1.default);
app.use("/api/admin/settings", settingsRoutes_1.default);
app.use("/api/chat", chatRoutes_1.default);
app.use("/api/support", supportRoutes_1.default);
app.use("/api/products", productVariantRoutes_1.default);
if (process.env.NODE_ENV !== "test") {
    mongoose_1.default
        .connect(process.env.MONGO_URI || "", {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
    })
        .then(() => {
        console.log("✅ MongoDB connected successfully");
    })
        .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        console.log("🔍 Connection string:", process.env.MONGO_URI ? "Present" : "Missing");
    });
    mongoose_1.default.connection.on("connected", () => {
        console.log("🔗 Mongoose connected to MongoDB");
    });
    mongoose_1.default.connection.on("error", (err) => {
        console.error("❌ Mongoose connection error:", err);
    });
}
mongoose_1.default.connection.on("disconnected", () => { });
process.on("SIGINT", async () => {
    await mongoose_1.default.connection.close();
    process.exit(0);
});
app.get("/products", async (req, res) => {
    try {
        const { admin } = req.query;
        let query = {};
        if (admin !== "true") {
            query = {
                status: "active",
                inStock: true,
            };
        }
        const products = await ProductModal_1.default.find(query).sort({ createdAt: -1 });
        console.log(`✅ Found ${products.length} ${admin === "true" ? "total" : "active"} products`);
        res.status(200).json({
            message: "Products fetched successfully",
            count: products.length,
            data: products,
        });
    }
    catch (error) {
        console.error("❌ Error fetching products:", error);
        res.status(500).json({
            message: "Error fetching products",
            error: error instanceof Error ? error.message : error,
        });
    }
});
app.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { admin } = req.query;
        let query = { _id: id };
        if (admin !== "true") {
            query = {
                _id: id,
                status: "active",
                inStock: true,
            };
        }
        const product = await ProductModal_1.default.findOne(query);
        if (!product) {
            return res.status(404).json({
                message: admin === "true"
                    ? "Product not found"
                    : "Product not found or not available",
            });
        }
        res.status(200).json({
            message: "Product fetched successfully",
            data: product,
        });
    }
    catch (error) {
        console.error("❌ Error fetching product:", error);
        res.status(500).json({
            message: "Error fetching product",
            error: error instanceof Error ? error.message : error,
        });
    }
});
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
        method: req.method,
    });
});
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Manual Fits Backend is running!",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
    });
});
app.get("/test-cloudinary", async (req, res) => {
    try {
        const cloudinary = require("./config/cloudinary").default;
        const result = await cloudinary.api.ping();
        res.json({
            success: true,
            message: "Cloudinary connection successful",
            cloudinary: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Cloudinary connection failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
app.post("/test-upload", async (req, res) => {
    try {
        const { uploadSingleMiddleware, } = require("./controllers/uploadController");
        uploadSingleMiddleware(req, res, async (err) => {
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
            }
            else {
                res.status(500).json({
                    success: false,
                    message: "Upload failed",
                    error: result.error,
                });
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Test upload error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        autoReplyService_1.AutoReplyService.startLateResponseChecker();
    });
}
exports.default = app;
