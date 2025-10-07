"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleMiddleware = exports.uploadSingleMiddleware = exports.deleteImage = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
const uploadSingle = async (req, res) => {
    try {
        console.log("Upload controller - Request received:", {
            hasFile: !!req.file,
            fileSize: req.file?.size,
            fileType: req.file?.mimetype,
            fileName: req.file?.originalname,
        });
        if (!req.file) {
            console.log("Upload controller - No file provided");
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }
        if (!req.file.mimetype.startsWith("image/")) {
            console.log("Upload controller - Invalid file type:", req.file.mimetype);
            return res.status(400).json({
                success: false,
                message: "Only image files are allowed",
            });
        }
        console.log("Upload controller - Starting Cloudinary upload");
        console.log("Upload controller - File details:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            bufferLength: req.file.buffer.length,
        });
        const result = await (0, cloudinaryUpload_1.uploadToCloudinary)(req.file, "manualfits/products");
        console.log("Upload controller - Upload result:", result);
        if (result.success) {
            console.log("Upload controller - Upload successful:", result.public_id);
            res.status(200).json({
                success: true,
                message: "Image uploaded successfully",
                data: {
                    url: result.url,
                    public_id: result.public_id,
                },
            });
        }
        else {
            console.error("Upload controller - Upload failed:", result.error);
            res.status(500).json({
                success: false,
                message: "Upload failed",
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Upload controller - Error:", error);
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.uploadSingle = uploadSingle;
const uploadMultiple = async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No image files provided",
            });
        }
        const results = await (0, cloudinaryUpload_1.uploadMultipleToCloudinary)(req.files, "manualfits/products");
        const successfulUploads = results.filter((result) => result.success);
        const failedUploads = results.filter((result) => !result.success);
        res.status(200).json({
            success: true,
            message: `${successfulUploads.length} images uploaded successfully`,
            data: {
                successful: successfulUploads.map((result) => ({
                    url: result.url,
                    public_id: result.public_id,
                })),
                failed: failedUploads.map((result) => ({
                    error: result.error,
                })),
            },
        });
    }
    catch (error) {
        console.error("Multiple upload error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.uploadMultiple = uploadMultiple;
const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;
        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: "Public ID is required",
            });
        }
        const success = await (0, cloudinaryUpload_1.deleteFromCloudinary)(publicId);
        if (success) {
            res.status(200).json({
                success: true,
                message: "Image deleted successfully",
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "Failed to delete image",
            });
        }
    }
    catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.deleteImage = deleteImage;
exports.uploadSingleMiddleware = upload.single("image");
exports.uploadMultipleMiddleware = upload.array("images", 10);
