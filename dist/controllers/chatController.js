"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatStats = exports.closeChat = exports.updateChatStatus = exports.sendMessage = exports.getChatMessages = exports.createChat = exports.getAdminChats = exports.getUserChats = void 0;
const Chat_1 = require("../models/Chat");
const mongoose_1 = require("mongoose");
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
            .sort({ lastMessageAt: -1, createdAt: -1 });
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
        const { orderId, category, priority, message } = req.body;
        const chat = new Chat_1.Chat({
            user: userId,
            order: orderId,
            category: category || "general",
            priority: priority || "medium",
            status: "open",
            isActive: true,
        });
        await chat.save();
        if (message) {
            const newMessage = new Chat_1.ChatMessage({
                chat: chat._id,
                sender: new mongoose_1.Types.ObjectId(userId),
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
        const chat = await Chat_1.Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }
        res.status(200).json({
            success: true,
            messages: await Chat_1.ChatMessage.find({ chat: chat._id }).sort({
                createdAt: 1,
            }),
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
        const { content, sender } = req.body;
        const senderId = req.user?.id || req.admin?.id;
        const chat = await Chat_1.Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }
        const newMessage = new Chat_1.ChatMessage({
            chat: chat._id,
            sender: new mongoose_1.Types.ObjectId(senderId || ""),
            senderType: sender === "admin" ? "admin" : "user",
            message: content,
            messageType: "text",
        });
        await newMessage.save();
        chat.lastMessage = newMessage._id;
        chat.lastMessageAt = newMessage.createdAt;
        chat.messageCount += 1;
        if (sender === "admin" && req.admin) {
            chat.admin = new mongoose_1.Types.ObjectId(req.admin.id);
            chat.status = "in_progress";
        }
        await chat.save();
        res.status(200).json({
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
        const { status } = req.body;
        const chat = await Chat_1.Chat.findByIdAndUpdate(chatId, { status }, { new: true }).populate("user", "username email");
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
const closeChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat_1.Chat.findByIdAndUpdate(chatId, {
            status: "closed",
            isActive: false,
            closedAt: new Date(),
        }, { new: true });
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
const getChatStats = async (req, res) => {
    try {
        const [totalChats, openChats, closedChats, inProgressChats] = await Promise.all([
            Chat_1.Chat.countDocuments(),
            Chat_1.Chat.countDocuments({ status: "open", isActive: true }),
            Chat_1.Chat.countDocuments({ status: "closed" }),
            Chat_1.Chat.countDocuments({ status: "in_progress", isActive: true }),
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
    }
    catch (error) {
        console.error("Error fetching chat stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chat stats",
        });
    }
};
exports.getChatStats = getChatStats;
