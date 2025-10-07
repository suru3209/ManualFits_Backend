import express from "express";
import {
  uploadSingle,
  uploadMultiple,
  deleteImage,
  uploadSingleMiddleware,
  uploadMultipleMiddleware,
} from "../controllers/uploadController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Upload single image
router.post("/single", authMiddleware, uploadSingleMiddleware, uploadSingle);

// Upload multiple images
router.post(
  "/multiple",
  authMiddleware,
  uploadMultipleMiddleware,
  uploadMultiple
);

// Delete image
router.delete("/:publicId", authMiddleware, deleteImage);

export default router;
