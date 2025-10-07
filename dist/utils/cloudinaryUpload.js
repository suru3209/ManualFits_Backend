"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleToCloudinary = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadToCloudinary = async (file, folder = "manualfits") => {
    try {
        console.log("Cloudinary config:", {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY ? "Present" : "Missing",
            api_secret: process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing",
        });
        console.log("Uploading file:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: file.buffer.length,
        });
        if (!file.buffer || file.buffer.length === 0) {
            throw new Error("File buffer is empty");
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.buffer.length > maxSize) {
            throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        }
        console.log("File size check passed:", {
            size: file.buffer.length,
            maxSize: maxSize,
            sizeMB: (file.buffer.length / (1024 * 1024)).toFixed(2),
        });
        console.log("Starting direct upload to Cloudinary...");
        let base64Data;
        try {
            base64Data = file.buffer.toString("base64");
            console.log("Base64 conversion successful, length:", base64Data.length);
        }
        catch (base64Error) {
            console.error("Base64 conversion failed:", base64Error);
            throw new Error("Failed to convert file to base64");
        }
        const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
        console.log("Data URL created, length:", dataUrl.length);
        const result = await cloudinary_1.default.uploader.upload(dataUrl, {
            folder: folder,
            resource_type: "auto",
            transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
            ],
            timeout: 60000,
        });
        console.log("Upload successful:", {
            public_id: result.public_id,
            url: result.secure_url,
        });
        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        };
    }
    catch (error) {
        console.error("Cloudinary upload error:", error);
        console.error("Error details:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : "No stack trace",
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary_1.default.uploader.destroy(publicId);
        return result.result === "ok";
    }
    catch (error) {
        console.error("Cloudinary delete error:", error);
        return false;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
const uploadMultipleToCloudinary = async (files, folder = "manualfits") => {
    const uploadPromises = files.map((file) => (0, exports.uploadToCloudinary)(file, folder));
    return Promise.all(uploadPromises);
};
exports.uploadMultipleToCloudinary = uploadMultipleToCloudinary;
