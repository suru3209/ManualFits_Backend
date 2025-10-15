"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const AttachmentSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["image", "file"], required: true },
    url: { type: String, required: true },
    filename: String,
    size: Number,
});
const ChatMessageSchema = new mongoose_1.Schema({
    chat: { type: mongoose_1.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, required: true },
    messageType: {
        type: String,
        enum: ["text", "image", "file"],
        default: "text",
    },
    attachments: [AttachmentSchema],
    orderReference: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order" },
    isRead: { type: Boolean, default: false },
    readAt: Date,
}, { timestamps: true });
const ChatSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    admin: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order" },
    subject: { type: String, required: true, trim: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    status: {
        type: String,
        enum: ["open", "in_progress", "resolved", "closed"],
        default: "open",
    },
    category: {
        type: String,
        enum: ["general", "order", "product", "payment", "technical", "refund"],
        default: "general",
    },
    lastMessage: { type: mongoose_1.Schema.Types.ObjectId, ref: "ChatMessage" },
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
ChatSchema.index({ user: 1, isActive: 1 });
ChatSchema.index({ admin: 1, status: 1 });
ChatSchema.index({ order: 1 });
ChatSchema.index({ status: 1, priority: 1 });
ChatSchema.index({ lastMessageAt: -1 });
ChatMessageSchema.index({ chat: 1, createdAt: 1 });
ChatMessageSchema.index({ sender: 1, senderType: 1 });
ChatMessageSchema.index({ orderReference: 1 });
exports.Chat = (0, mongoose_1.model)("Chat", ChatSchema);
exports.ChatMessage = (0, mongoose_1.model)("ChatMessage", ChatMessageSchema);
