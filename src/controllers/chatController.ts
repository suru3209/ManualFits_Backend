import { Request, Response } from "express";
import { Chat, ChatMessage } from "../models/Chat";
import User from "../models/User";
import { Order } from "../models/Order";
import Admin from "../models/Admin";

// Get all chats for a user
export const getUserChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const chats = await Chat.find({ user: userId })
      .populate("admin", "username")
      .populate("order", "totalAmount status")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
};

// Get all chats for admin
export const getAdminChats = async (req: Request, res: Response) => {
  try {
    const { status, priority, category } = req.query;

    const filter: any = {};

    // Only filter by isActive if status is not 'closed'
    if (status && status !== "closed") {
      filter.isActive = true;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const chats = await Chat.find(filter)
      .populate("user", "username email")
      .populate("admin", "username")
      .populate("order", "totalAmount status")
      .populate("lastMessage")
      .sort({
        priority: 1, // urgent, high, medium, low
        lastMessageAt: -1,
      });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching admin chats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
};

// Create a new chat
export const createChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { subject, priority, category, orderId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate order reference if provided
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, user: userId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found or doesn't belong to user",
        });
      }
    }

    const chatData: any = {
      user: userId,
      subject,
      priority: priority || "medium",
      category: category || "general",
    };

    if (orderId) {
      chatData.order = orderId;
      chatData.category = "order";
    }

    const chat = new Chat(chatData);
    await chat.save();

    await chat.populate([
      { path: "user", select: "username email" },
      { path: "order", select: "totalAmount status" },
    ]);

    res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create chat",
    });
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id || req.admin?.id;
    const userType = req.admin ? "admin" : "user";

    // Verify chat access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user has access to this chat
    const hasAccess = userType === "admin" || chat.user.toString() === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const messages = await ChatMessage.find({ chat: chatId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    // Mark messages as read for the current user
    await ChatMessage.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { message, messageType, attachments, orderReference } = req.body;
    const userId = req.user?.id || req.admin?.id;
    const userType = req.admin ? "admin" : "user";

    // Verify chat exists and user has access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const hasAccess = userType === "admin" || chat.user.toString() === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Create message
    const messageData: any = {
      chat: chatId,
      sender: userId,
      senderType: userType === "admin" ? "admin" : "user",
      message,
      messageType: messageType || "text",
    };

    if (attachments) {
      messageData.attachments = attachments;
    }

    if (orderReference) {
      messageData.orderReference = orderReference;
    }

    const newMessage = new ChatMessage(messageData);
    await newMessage.save();

    // Update chat with last message info
    chat.lastMessage = newMessage._id;
    chat.lastMessageAt = new Date();
    chat.messageCount += 1;

    // Update chat status if it was closed
    if (chat.status === "closed" || chat.status === "resolved") {
      chat.status = "open";
    }

    await chat.save();

    // Populate message data
    await newMessage.populate([
      { path: "sender", select: "username" },
      { path: "orderReference", select: "totalAmount status" },
    ]);

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Update chat status (admin only)
export const updateChatStatus = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { status, priority, adminId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (status) chat.status = status;
    if (priority) chat.priority = priority;
    if (adminId) {
      // Verify admin exists
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
      chat.admin = adminId;
    }

    await chat.save();

    await chat.populate([
      { path: "user", select: "username email" },
      { path: "admin", select: "username" },
      { path: "order", select: "totalAmount status" },
      { path: "lastMessage" },
    ]);

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error updating chat status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update chat status",
    });
  }
};

// Get chat statistics for admin dashboard
export const getChatStats = async (req: Request, res: Response) => {
  try {
    const totalChats = await Chat.countDocuments({ isActive: true });
    const openChats = await Chat.countDocuments({
      status: "open",
      isActive: true,
    });
    const inProgressChats = await Chat.countDocuments({
      status: "in_progress",
      isActive: true,
    });
    const resolvedChats = await Chat.countDocuments({
      status: "resolved",
      isActive: true,
    });
    const urgentChats = await Chat.countDocuments({
      priority: "urgent",
      status: { $in: ["open", "in_progress"] },
      isActive: true,
    });

    res.status(200).json({
      success: true,
      stats: {
        totalChats,
        openChats,
        inProgressChats,
        resolvedChats,
        urgentChats,
      },
    });
  } catch (error) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat statistics",
    });
  }
};

// Close a chat
export const closeChat = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id || req.admin?.id;
    const userType = req.admin ? "admin" : "user";

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const hasAccess = userType === "admin" || chat.user.toString() === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    chat.status = "closed";
    chat.isActive = false;
    await chat.save();

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("chat_status_changed", {
        chatId: chat._id,
        status: "closed",
        isActive: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Chat closed successfully",
    });
  } catch (error) {
    console.error("Error closing chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close chat",
    });
  }
};
