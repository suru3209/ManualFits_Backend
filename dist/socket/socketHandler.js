"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Chat_1 = require("../models/Chat");
const Ticket_1 = __importDefault(require("../models/Ticket"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const Admin_1 = __importDefault(require("../models/Admin"));
class SocketHandler {
    constructor(io) {
        this.connectedUsers = new Map();
        this.userSockets = new Map();
        this.io = io;
        this.setupSocketHandlers();
    }
    async authenticateSocket(socket) {
        try {
            const token = socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.replace("Bearer ", "");
            if (!token) {
                return null;
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key-here");
                id: decoded.id,
                role: decoded.role,
                username: decoded.username,
            });
            if (decoded.role === "admin" ||
                decoded.role === "super_admin" ||
                decoded.role === "moderator") {
                const admin = await Admin_1.default.findById(decoded.id);
                if (!admin)
                    return null;
                return {
                    userId: admin._id.toString(),
                    userType: "admin",
                    username: admin.username,
                };
            }
            else {
                const user = await User_1.default.findById(decoded.id);
                if (!user)
                    return null;
                return {
                    userId: user._id.toString(),
                    userType: "user",
                    username: user.username,
                };
            }
        }
        catch (error) {
            console.error("Socket authentication error:", error);
            return null;
        }
    }
    setupSocketHandlers() {
        this.io.on("connection", async (socket) => {
            const auth = await this.authenticateSocket(socket);
            if (!auth) {
                socket.emit("auth_error", { message: "Authentication failed" });
                socket.disconnect();
                return;
            }
            this.connectedUsers.set(socket.id, auth);
            this.userSockets.set(auth.userId, socket.id);
            socket.join(`user_${auth.userId}`);
            if (auth.userType === "admin") {
                socket.join("admin_room");
                socket.join("support_admin_room");
            }
            if (auth.userType === "user") {
                socket.join("support_user_room");
            }
            socket.on("join_chat", (chatId) => {
                socket.join(`chat_${chatId}`);
            });
            socket.on("join_support_ticket", (ticketId) => {
                socket.join(`ticket_${ticketId}`);
            });
            socket.on("leave_chat", (chatId) => {
                socket.leave(`chat_${chatId}`);
            });
            socket.on("leave_support_ticket", (ticketId) => {
                socket.leave(`ticket_${ticketId}`);
            });
            socket.on("send_message", async (data) => {
                try {
                    const { chatId, message, messageType, attachments, orderReference, } = data;
                    const chat = await Chat_1.Chat.findById(chatId);
                    if (!chat) {
                        socket.emit("error", { message: "Chat not found" });
                        return;
                    }
                    const hasAccess = auth.userType === "admin" || chat.user.toString() === auth.userId;
                    if (!hasAccess) {
                        socket.emit("error", { message: "Access denied" });
                        return;
                    }
                    const messageData = {
                        chat: chatId,
                        sender: auth.userId,
                        senderType: auth.userType,
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
                    this.io.to(`chat_${chatId}`).emit("new_message", {
                        message: newMessage,
                        chatId,
                    });
                    if (auth.userType === "user") {
                        this.io.to("admin_room").emit("new_user_message", {
                            chatId,
                            message: newMessage,
                            userId: auth.userId,
                            username: auth.username,
                        });
                    }
                    else {
                        this.io.to(`user_${chat.user}`).emit("new_admin_message", {
                            chatId,
                            message: newMessage,
                            adminUsername: auth.username,
                        });
                    }
                }
                catch (error) {
                    console.error("Error sending message:", error);
                    socket.emit("error", { message: "Failed to send message" });
                }
            });
            socket.on("send_support_message", async (data) => {
                try {
                    const { ticketId, message, messageType = "text" } = data;
                    const ticket = await Ticket_1.default.findById(ticketId);
                    if (!ticket) {
                        socket.emit("error", { message: "Ticket not found" });
                        return;
                    }
                    const hasAccess = auth.userType === "admin" ||
                        ticket.userId.toString() === auth.userId;
                    if (!hasAccess) {
                        socket.emit("error", { message: "Access denied" });
                        return;
                    }
                    const messageData = {
                        ticketId,
                        sender: auth.userType,
                        senderId: auth.userId,
                        message,
                        messageType,
                    };
                    const newMessage = new Message_1.default(messageData);
                    await newMessage.save();
                    ticket.lastMessageAt = new Date();
                    await ticket.save();
                    await newMessage.populate([
                        { path: "senderId", select: "username email" },
                    ]);
                    this.io.to(`ticket_${ticketId}`).emit("new_support_message", {
                        message: newMessage,
                        ticketId,
                    });
                    if (auth.userType === "user") {
                        this.io
                            .to("support_admin_room")
                            .emit("new_user_support_message", {
                            ticketId,
                            message: newMessage,
                            userId: auth.userId,
                            username: auth.username,
                        });
                    }
                    else {
                        this.io
                            .to(`user_${ticket.userId}`)
                            .emit("new_admin_support_message", {
                            ticketId,
                            message: newMessage,
                            adminUsername: auth.username,
                        });
                    }
                }
                catch (error) {
                    console.error("Error sending support message:", error);
                    socket.emit("error", { message: "Failed to send support message" });
                }
            });
            socket.on("typing_start", (chatId) => {
                socket.to(`chat_${chatId}`).emit("user_typing", {
                    userId: auth.userId,
                    username: auth.username,
                    userType: auth.userType,
                });
            });
            socket.on("typing_stop", (chatId) => {
                socket.to(`chat_${chatId}`).emit("user_stopped_typing", {
                    userId: auth.userId,
                    username: auth.username,
                    userType: auth.userType,
                });
            });
            socket.on("support_typing_start", (ticketId) => {
                socket.to(`ticket_${ticketId}`).emit("support_user_typing", {
                    userId: auth.userId,
                    username: auth.username,
                    userType: auth.userType,
                });
            });
            socket.on("support_typing_stop", (ticketId) => {
                socket.to(`ticket_${ticketId}`).emit("support_user_stopped_typing", {
                    userId: auth.userId,
                    username: auth.username,
                    userType: auth.userType,
                });
            });
            socket.on("mark_messages_read", async (chatId) => {
                try {
                    await Chat_1.ChatMessage.updateMany({
                        chat: chatId,
                        sender: { $ne: auth.userId },
                        isRead: false,
                    }, {
                        isRead: true,
                        readAt: new Date(),
                    });
                    socket.to(`chat_${chatId}`).emit("messages_read", {
                        userId: auth.userId,
                        username: auth.username,
                        userType: auth.userType,
                    });
                }
                catch (error) {
                    console.error("Error marking messages as read:", error);
                }
            });
            socket.on("mark_support_messages_read", async (ticketId) => {
                try {
                    const oppositeSender = auth.userType === "user" ? "admin" : "user";
                    await Message_1.default.updateMany({
                        ticketId,
                        sender: oppositeSender,
                        seen: false,
                    }, {
                        seen: true,
                    });
                    socket.to(`ticket_${ticketId}`).emit("support_messages_read", {
                        userId: auth.userId,
                        username: auth.username,
                        userType: auth.userType,
                    });
                }
                catch (error) {
                    console.error("Error marking support messages as read:", error);
                }
            });
            socket.on("update_chat_status", async (data) => {
                if (auth.userType !== "admin") {
                    socket.emit("error", { message: "Access denied" });
                    return;
                }
                try {
                    const { chatId, status, priority, adminId } = data;
                    const chat = await Chat_1.Chat.findById(chatId);
                    if (!chat) {
                        socket.emit("error", { message: "Chat not found" });
                        return;
                    }
                    if (status)
                        chat.status = status;
                    if (priority)
                        chat.priority = priority;
                    if (adminId)
                        chat.admin = adminId;
                    await chat.save();
                    this.io.to(`chat_${chatId}`).emit("chat_status_updated", {
                        chatId,
                        status: chat.status,
                        priority: chat.priority,
                        adminId: chat.admin,
                    });
                    this.io.to(`user_${chat.user}`).emit("chat_status_changed", {
                        chatId,
                        status: chat.status,
                        priority: chat.priority,
                    });
                }
                catch (error) {
                    console.error("Error updating chat status:", error);
                    socket.emit("error", { message: "Failed to update chat status" });
                }
            });
            socket.on("update_support_ticket_status", async (data) => {
                if (auth.userType !== "admin") {
                    socket.emit("error", { message: "Access denied" });
                    return;
                }
                try {
                    const { ticketId, status, priority, assignedAdmin } = data;
                    const ticket = await Ticket_1.default.findById(ticketId);
                    if (!ticket) {
                        socket.emit("error", { message: "Ticket not found" });
                        return;
                    }
                    if (status)
                        ticket.status = status;
                    if (priority)
                        ticket.priority = priority;
                    if (assignedAdmin)
                        ticket.assignedAdmin = assignedAdmin;
                    await ticket.save();
                    this.io
                        .to(`ticket_${ticketId}`)
                        .emit("support_ticket_status_updated", {
                        ticketId,
                        status: ticket.status,
                        priority: ticket.priority,
                        assignedAdmin: ticket.assignedAdmin,
                    });
                    this.io
                        .to(`user_${ticket.userId}`)
                        .emit("support_ticket_status_changed", {
                        ticketId,
                        status: ticket.status,
                        priority: ticket.priority,
                    });
                    if (status === "closed") {
                        const feedbackMessage = new Message_1.default({
                            ticketId,
                            sender: "admin",
                            message: "💬 Please rate your chat experience (1–5 stars) and add a short comment.",
                            messageType: "auto-reply",
                        });
                        await feedbackMessage.save();
                        this.io.to(`ticket_${ticketId}`).emit("new_support_message", {
                            message: feedbackMessage,
                            ticketId,
                        });
                    }
                }
                catch (error) {
                    console.error("Error updating support ticket status:", error);
                    socket.emit("error", { message: "Failed to update ticket status" });
                }
            });
            socket.on("user_closed_ticket", async (data) => {
                socket.to("support_admin_room").emit("user_closed_ticket", {
                    ticketId: data.ticketId,
                    userId: data.userId,
                    message: data.message,
                    closedBy: auth.username,
                });
            });
            socket.on("test_connection", (data) => {
                socket.emit("test_connection_response", {
                    received: true,
                    timestamp: new Date(),
                });
            });
            socket.on("disconnect", () => {
                this.connectedUsers.delete(socket.id);
                this.userSockets.delete(auth.userId);
            });
        });
    }
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    getOnlineUsers() {
        return Array.from(this.connectedUsers.values());
    }
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }
    sendNotificationToUser(userId, event, data) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }
    broadcastToAdmins(event, data) {
        this.io.to("admin_room").emit(event, data);
    }
    broadcastToUsers(event, data) {
        this.io.to("user_room").emit(event, data);
    }
}
exports.SocketHandler = SocketHandler;
