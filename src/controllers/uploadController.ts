import { Request, Response } from "express";
import multer from "multer";
import {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Single image upload
export const uploadSingle = async (req: Request, res: Response) => {
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

    // Validate file
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

    const result = await uploadToCloudinary(req.file, "manualfits/products");
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
    } else {
      console.error("Upload controller - Upload failed:", result.error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Upload controller - Error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Multiple images upload
export const uploadMultiple = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    const results = await uploadMultipleToCloudinary(
      req.files,
      "manualfits/products"
    );

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
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete image
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const success = await deleteFromCloudinary(publicId);

    if (success) {
      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete image",
      });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Middleware for single upload
export const uploadSingleMiddleware = upload.single("image");

// Middleware for multiple uploads
export const uploadMultipleMiddleware = upload.array("images", 10); // Max 10 images
