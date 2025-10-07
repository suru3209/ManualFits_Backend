import express from "express";
import {
  getUserChats,
  getAdminChats,
  createChat,
  getChatMessages,
  sendMessage,
  updateChatStatus,
  getChatStats,
  closeChat,
} from "../controllers/chatController";
import { authenticateToken } from "../middleware/authMiddleware";
import { adminAuth } from "../middleware/adminAuthMiddleware";

const router = express.Router();

// User routes
router.get("/user/chats", authenticateToken, getUserChats);
router.post("/user/chats", authenticateToken, createChat);
router.get("/user/chats/:chatId/messages", authenticateToken, getChatMessages);
router.post("/user/chats/:chatId/messages", authenticateToken, sendMessage);
router.patch("/user/chats/:chatId/close", authenticateToken, closeChat);

// Admin routes
router.get("/admin/chats", adminAuth, getAdminChats);
router.get("/admin/chats/:chatId/messages", adminAuth, getChatMessages);
router.post("/admin/chats/:chatId/messages", adminAuth, sendMessage);
router.patch("/admin/chats/:chatId/status", adminAuth, updateChatStatus);
router.patch("/admin/chats/:chatId/close", adminAuth, closeChat);
router.get("/admin/chats/stats", adminAuth, getChatStats);

export default router;
