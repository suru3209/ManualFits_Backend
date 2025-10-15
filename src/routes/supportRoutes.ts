import * as express from "express";
import {
  createTicket,
  getTickets,
  getUserTickets,
  getTicketWithMessages,
  sendMessage,
  updateTicketStatus,
  closeUserTicket,
  submitFeedback,
  getTicketStats,
  markMessagesAsSeen,
  autoCloseTicket,
} from "../controllers/supportController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminAuth } from "../middleware/adminAuthMiddleware";

const router = express.Router();

// Public routes (for users)
router.post("/tickets", createTicket);
router.post("/tickets/:id/messages", sendMessage);
router.post("/tickets/:id/feedback", submitFeedback);
router.post("/tickets/:id/seen", markMessagesAsSeen);

// Protected routes (for authenticated users)
router.get("/tickets", authMiddleware, getUserTickets);
router.get("/tickets/:id", authMiddleware, getTicketWithMessages);
router.put("/tickets/:id/close", authMiddleware, closeUserTicket);
router.put("/tickets/:id/auto-close", authMiddleware, autoCloseTicket);

// Admin only routes
router.get("/admin/tickets", adminAuth, getTickets);
router.get("/stats", adminAuth, getTicketStats);
router.put("/tickets/:id/status", adminAuth, updateTicketStatus);

export default router;
