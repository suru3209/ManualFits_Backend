import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "manualfits"
): Promise<CloudinaryUploadResult> => {
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

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error("File buffer is empty");
    }

    // Check file size (limit to 10MB for base64 encoding)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.buffer.length > maxSize) {
      throw new Error(
        `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
      );
    }

    console.log("File size check passed:", {
      size: file.buffer.length,
      maxSize: maxSize,
      sizeMB: (file.buffer.length / (1024 * 1024)).toFixed(2),
    });

    // Use direct upload method (more reliable than stream)
    console.log("Starting direct upload to Cloudinary...");

    // Convert buffer to base64 with error handling
    let base64Data: string;
    try {
      base64Data = file.buffer.toString("base64");
      console.log("Base64 conversion successful, length:", base64Data.length);
    } catch (base64Error) {
      console.error("Base64 conversion failed:", base64Error);
      throw new Error("Failed to convert file to base64");
    }

    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
    console.log("Data URL created, length:", dataUrl.length);

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: folder,
      resource_type: "auto",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
      ],
      timeout: 60000, // 60 seconds timeout
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
  } catch (error) {
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

export const deleteFromCloudinary = async (
  publicId: string
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
};

export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = "manualfits"
): Promise<CloudinaryUploadResult[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};
