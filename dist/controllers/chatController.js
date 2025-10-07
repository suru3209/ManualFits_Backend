"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeChat = exports.getChatStats = exports.updateChatStatus = exports.sendMessage = exports.getChatMessages = exports.createChat = exports.getAdminChats = exports.getUserChats = void 0;
const Chat_1 = require("../models/Chat");
const User_1 = __importDefault(require("../models/User"));
const Order_1 = require("../models/Order");
const Admin_1 = __importDefault(require("../models/Admin"));
const getUserChats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const chats = await Chat_1.Chat.find({ user: userId })
            .populate("admin", "username")
            .populate("order", "totalAmount status")
            .populate("lastMessage")
            .sort({ lastMessageAt: -1, createdAt: -1 });
        res.status(200).json({
            success: true,
            chats,
        });
    }
    catch (error) {
        console.error("Error fetching user chats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chats",
        });
    }
};
exports.getUserChats = getUserChats;
const getAdminChats = async (req, res) => {
    try {
        const { status, priority, category } = req.query;
        const filter = {};
        if (status && status !== "closed") {
            filter.isActive = true;
        }
        if (status)
            filter.status = status;
        if (priority)
            filter.priority = priority;
        if (category)
            filter.category = category;
        const chats = await Chat_1.Chat.find(filter)
            .populate("user", "username email")
            .populate("admin", "username")
            .populate("order", "totalAmount status")
            .populate("lastMessage")
            .sort({
            priority: 1,
            lastMessageAt: -1,
        });
        res.status(200).json({
            success: true,
            chats,
        });
    }
    catch (error) {
        console.error("Error fetching admin chats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chats",
        });
    }
};
exports.getAdminChats = getAdminChats;
const createChat = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { subject, priority, category, orderId } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        if (orderId) {
            const order = await Order_1.Order.findOne({ _id: orderId, user: userId });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found or doesn't belong to user",
                });
            }
        }
        const chatData = {
            user: userId,
            subject,
            priority: priority || "medium",
            category: category || "general",
        };
        if (orderId) {
            chatData.order = orderId;
            chatData.category = "order";
        }
        const chat = new Chat_1.Chat(chatData);
        await chat.save();
        await chat.populate([
            { path: "user", select: "username email" },
            { path: "order", select: "totalAmount status" },
        ]);
        res.status(201).json({
            success: true,
            chat,
        });
    }
    catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create chat",
        });
    }
};
exports.createChat = createChat;
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id || req.admin?.id;
        const userType = req.admin ? "admin" : "user";
        const chat = await Chat_1.Chat.findById(chatId);
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
        const messages = await Chat_1.ChatMessage.find({ chat: chatId })
            .populate("sender", "username")
            .sort({ createdAt: 1 });
        await Chat_1.ChatMessage.updateMany({
            chat: chatId,
            sender: { $ne: userId },
            isRead: false,
        }, {
            isRead: true,
            readAt: new Date(),
        });
        res.status(200).json({
            success: true,
            messages,
        });
    }
    catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
};
exports.getChatMessages = getChatMessages;
const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message, messageType, attachments, orderReference } = req.body;
        const userId = req.user?.id || req.admin?.id;
        const userType = req.admin ? "admin" : "user";
        const chat = await Chat_1.Chat.findById(chatId);
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
        const messageData = {
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
        const newMessage = new Chat_1.ChatMessage(messageData);
        await newMessage.save();
        chat.lastMessage = newMessage._id;
        chat.lastMessageAt = new Date();
        chat.messageCount += 1;
        if (chat.status === "closed" || chat.status === "resolved") {
            chat.status = "open";
        }
        await chat.save();
        await newMessage.populate([
            { path: "sender", select: "username" },
            { path: "orderReference", select: "totalAmount status" },
        ]);
        res.status(201).json({
            success: true,
            message: newMessage,
        });
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
};
exports.sendMessage = sendMessage;
const updateChatStatus = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { status, priority, adminId } = req.body;
        const chat = await Chat_1.Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }
        if (status)
            chat.status = status;
        if (priority)
            chat.priority = priority;
        if (adminId) {
            const admin = await Admin_1.default.findById(adminId);
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
    }
    catch (error) {
        console.error("Error updating chat status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update chat status",
        });
    }
};
exports.updateChatStatus = updateChatStatus;
const getChatStats = async (req, res) => {
    try {
        const totalChats = await Chat_1.Chat.countDocuments({ isActive: true });
        const openChats = await Chat_1.Chat.countDocuments({
            status: "open",
            isActive: true,
        });
        const inProgressChats = await Chat_1.Chat.countDocuments({
            status: "in_progress",
            isActive: true,
        });
        const resolvedChats = await Chat_1.Chat.countDocuments({
            status: "resolved",
            isActive: true,
        });
        const urgentChats = await Chat_1.Chat.countDocuments({
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
    }
    catch (error) {
        console.error("Error fetching chat stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chat statistics",
        });
    }
};
exports.getChatStats = getChatStats;
const closeChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id || req.admin?.id;
        const userType = req.admin ? "admin" : "user";
        const chat = await Chat_1.Chat.findById(chatId);
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
    }
    catch (error) {
        console.error("Error closing chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to close chat",
        });
    }
};
exports.closeChat = closeChat;
