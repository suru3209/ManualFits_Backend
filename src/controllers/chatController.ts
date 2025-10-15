import { Request, Response } from "express";
import { Chat, ChatMessage } from "../models/Chat";
import User from "../models/User";
import { Order } from "../models/Order";
import Admin from "../models/Admin";
import { Types } from "mongoose";

interface UserRequest extends Request {
  user?: {
    id: string;
    name?: string;
    username?: string;
    email?: string;
  };
}

interface AdminRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

export const getUserChats = async (req: UserRequest, res: Response) => {
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

export const getAdminChats = async (req: AdminRequest, res: Response) => {
  try {
    const { status, priority, category } = req.query;
    const filter: any = {};

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
      .sort({ lastMessageAt: -1, createdAt: -1 });

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

export const createChat = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId, category, priority, message } = req.body;

    const chat = new Chat({
      user: userId,
      order: orderId,
      category: category || "general",
      priority: priority || "medium",
      status: "open",
      isActive: true,
    });

    await chat.save();

    if (message) {
      const newMessage = new ChatMessage({
        chat: chat._id,
        sender: new Types.ObjectId(userId),
        senderType: "user",
        message: message,
        messageType: "text",
      });

      await newMessage.save();

      chat.lastMessage = newMessage._id;
      chat.lastMessageAt = newMessage.createdAt;
      chat.messageCount += 1;
      await chat.save();
    }

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

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      messages: await ChatMessage.find({ chat: chat._id }).sort({
        createdAt: 1,
      }),
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content, sender } = req.body;
    const senderId = req.user?.id || req.admin?.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const newMessage = new ChatMessage({
      chat: chat._id,
      sender: new Types.ObjectId(senderId || ""),
      senderType: sender === "admin" ? "admin" : "user",
      message: content,
      messageType: "text",
    });

    await newMessage.save();

    chat.lastMessage = newMessage._id;
    chat.lastMessageAt = newMessage.createdAt;
    chat.messageCount += 1;

    if (sender === "admin" && req.admin) {
      chat.admin = new Types.ObjectId(req.admin.id);
      chat.status = "in_progress";
    }

    await chat.save();

    res.status(200).json({
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

export const updateChatStatus = async (req: AdminRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body;

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { status },
      { new: true }
    ).populate("user", "username email");

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

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

export const closeChat = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        status: "closed",
        isActive: false,
        closedAt: new Date(),
      },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
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

export const getChatStats = async (req: AdminRequest, res: Response) => {
  try {
    const [totalChats, openChats, closedChats, inProgressChats] =
      await Promise.all([
        Chat.countDocuments(),
        Chat.countDocuments({ status: "open", isActive: true }),
        Chat.countDocuments({ status: "closed" }),
        Chat.countDocuments({ status: "in_progress", isActive: true }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalChats,
        openChats,
        closedChats,
        inProgressChats,
      },
    });
  } catch (error) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat stats",
    });
  }
};
