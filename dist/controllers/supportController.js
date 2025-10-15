"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesAsSeen = exports.getUserTickets = exports.getTicketStats = exports.submitFeedback = exports.closeUserTicket = exports.updateTicketStatus = exports.sendMessage = exports.getTicketWithMessages = exports.getTickets = exports.createTicket = exports.setSocketInstance = void 0;
const Ticket_1 = __importDefault(require("../models/Ticket"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const Order_1 = require("../models/Order");
const mongoose_1 = __importDefault(require("mongoose"));
const autoReplyService_1 = require("../utils/autoReplyService");
let io;
const setSocketInstance = (socketInstance) => {
    io = socketInstance;
};
exports.setSocketInstance = setSocketInstance;
const createTicket = async (req, res) => {
    try {
        const { userEmail, subject, message, category, priority, orderId } = req.body;
        if (!userEmail || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "User email, subject, and message are required",
            });
        }
        const user = await User_1.default.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const ticket = new Ticket_1.default({
            userId: user._id,
            userEmail,
            subject,
            category: category || "general",
            priority: priority || "medium",
            status: "open",
            ...(orderId && { orderId }),
        });
        await ticket.save();
        const initialMessage = new Message_1.default({
            ticketId: ticket._id,
            sender: "user",
            senderId: user._id,
            message,
            messageType: "text",
        });
        await initialMessage.save();
        await autoReplyService_1.AutoReplyService.sendWelcomeMessage(ticket._id.toString());
        await autoReplyService_1.AutoReplyService.notifyAdminsNewTicket(ticket);
        const welcomeMessage = await Message_1.default.findOne({
            ticketId: ticket._id,
            messageType: "auto-reply",
        }).sort({ timestamp: -1 });
        res.status(201).json({
            success: true,
            data: {
                ticket,
                messages: welcomeMessage
                    ? [initialMessage, welcomeMessage]
                    : [initialMessage],
            },
        });
    }
    catch (error) {
        console.error("Create ticket error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create ticket",
        });
    }
};
exports.createTicket = createTicket;
const getTickets = async (req, res) => {
    try {
        const { status, priority, category, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (priority)
            filter.priority = priority;
        if (category)
            filter.category = category;
        const tickets = await Ticket_1.default.find(filter)
            .populate("userId", "username email")
            .populate("assignedAdmin", "username")
            .sort({ lastMessageAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const ticketsWithOrderDetails = await Promise.all(tickets.map(async (ticket) => {
            if (ticket.orderId) {
                try {
                    const order = await Order_1.Order.findById(ticket.orderId)
                        .populate("items.product", "name images")
                        .lean();
                    if (order) {
                        return {
                            ...ticket.toObject(),
                            orderDetails: order,
                        };
                    }
                }
                catch (error) {
                    console.error("Error fetching order details:", error);
                }
            }
            return ticket.toObject();
        }));
        const total = await Ticket_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: {
                tickets: ticketsWithOrderDetails,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        console.error("Get tickets error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch tickets",
        });
    }
};
exports.getTickets = getTickets;
const getTicketWithMessages = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }
        const ticket = await Ticket_1.default.findById(id)
            .populate("userId", "username email")
            .populate("assignedAdmin", "username");
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
        const messages = await Message_1.default.find({ ticketId: id })
            .sort({ timestamp: 1 })
            .populate("senderId", "username email");
        res.json({
            success: true,
            data: {
                ticket,
                messages,
            },
        });
    }
    catch (error) {
        console.error("Get ticket error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch ticket",
        });
    }
};
exports.getTicketWithMessages = getTicketWithMessages;
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, sender, senderId, messageType = "text", attachments = [], } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }
        if (!sender) {
            return res.status(400).json({
                success: false,
                message: "Sender is required",
            });
        }
        if (!message && (!attachments || attachments.length === 0)) {
            return res.status(400).json({
                success: false,
                message: "Message or attachments are required",
            });
        }
        const ticket = await Ticket_1.default.findById(id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
        const newMessage = new Message_1.default({
            ticketId: id,
            sender,
            senderId,
            message,
            messageType,
            attachments: attachments.map((att) => ({
                url: att.url,
                filename: att.filename,
                mimetype: att.fileType,
            })),
        });
        await newMessage.save();
        ticket.lastMessageAt = new Date();
        await ticket.save();
        await newMessage.populate([{ path: "senderId", select: "username email" }]);
        if (io) {
                message: newMessage,
                ticketId: id,
            });
            io.to(`ticket_${id}`).emit("new_support_message", {
                message: newMessage,
                ticketId: id,
            });
            if (sender === "user") {
                io.to("support_admin_room").emit("new_user_support_message", {
                    ticketId: id,
                    message: newMessage,
                    userId: senderId,
                });
            }
        }
        else {
        }
        if (sender === "user") {
            const autoResponse = await autoReplyService_1.AutoReplyService.generateCategoryResponse(ticket, message);
            if (autoResponse) {
                const autoMessage = new Message_1.default({
                    ticketId: id,
                    sender: "admin",
                    message: autoResponse,
                    messageType: "auto-reply",
                });
                await autoMessage.save();
                if (io) {
                    io.to(`ticket_${id}`).emit("new_support_message", {
                        message: autoMessage,
                        ticketId: id,
                    });
                }
            }
        }
        res.status(201).json({
            success: true,
            data: newMessage,
        });
    }
    catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
};
exports.sendMessage = sendMessage;
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedAdmin } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }
        const updateData = {};
        if (status)
            updateData.status = status;
        if (assignedAdmin)
            updateData.assignedAdmin = assignedAdmin;
        const ticket = await Ticket_1.default.findByIdAndUpdate(id, updateData, { new: true })
            .populate("userId", "username email")
            .populate("assignedAdmin", "username");
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
        if (status === "closed") {
            await autoReplyService_1.AutoReplyService.sendFeedbackRequest(id);
            await autoReplyService_1.AutoReplyService.notifyUserTicketUpdate(ticket, status);
        }
        else if (status) {
            await autoReplyService_1.AutoReplyService.notifyUserTicketUpdate(ticket, status);
        }
        res.json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        console.error("Update ticket error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update ticket",
        });
    }
};
exports.updateTicketStatus = updateTicketStatus;
const closeUserTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }
        const ticket = await Ticket_1.default.findOne({ _id: id, userId });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found or you don't have permission to close it",
            });
        }
        const updatedTicket = await Ticket_1.default.findByIdAndUpdate(id, { status: "closed" }, { new: true })
            .populate("userId", "username email")
            .populate("assignedAdmin", "username");
        await autoReplyService_1.AutoReplyService.sendFeedbackRequest(id);
        await autoReplyService_1.AutoReplyService.notifyUserTicketUpdate(updatedTicket, "closed");
        res.json({
            success: true,
            data: { ticket: updatedTicket },
        });
    }
    catch (error) {
        console.error("Close user ticket error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to close ticket",
        });
    }
};
exports.closeUserTicket = closeUserTicket;
const submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, message } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
        }
        const ticket = await Ticket_1.default.findByIdAndUpdate(id, {
            feedback: {
                rating,
                message,
                submittedAt: new Date(),
            },
        }, { new: true });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
        res.json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        console.error("Submit feedback error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit feedback",
        });
    }
};
exports.submitFeedback = submitFeedback;
const getTicketStats = async (req, res) => {
    try {
        const totalTickets = await Ticket_1.default.countDocuments();
        const openTickets = await Ticket_1.default.countDocuments({ status: "open" });
        const inProgressTickets = await Ticket_1.default.countDocuments({
            status: "in-progress",
        });
        const closedTickets = await Ticket_1.default.countDocuments({ status: "closed" });
        const avgResponseTime = await Ticket_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    avgResponseTime: { $avg: "$lastMessageAt" },
                },
            },
        ]);
        const ticketsByCategory = await Ticket_1.default.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
        ]);
        const ticketsByPriority = await Ticket_1.default.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                totalTickets,
                openTickets,
                inProgressTickets,
                closedTickets,
                avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
                ticketsByCategory,
                ticketsByPriority,
            },
        });
    }
    catch (error) {
        console.error("Get ticket stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch ticket statistics",
        });
    }
};
exports.getTicketStats = getTicketStats;
const getUserTickets = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        const tickets = await Ticket_1.default.find({ userId })
            .populate("assignedAdmin", "username")
            .sort({ lastMessageAt: -1 });
        const ticketsWithOrderDetails = await Promise.all(tickets.map(async (ticket) => {
            if (ticket.orderId) {
                try {
                    const order = await Order_1.Order.findById(ticket.orderId)
                        .populate("items.product", "name images")
                        .lean();
                    if (order) {
                        return {
                            ...ticket.toObject(),
                            orderDetails: order,
                        };
                    }
                }
                catch (error) {
                    console.error("Error fetching order details:", error);
                }
            }
            return ticket.toObject();
        }));
        res.json({
            success: true,
            data: {
                tickets: ticketsWithOrderDetails,
            },
        });
    }
    catch (error) {
        console.error("Get user tickets error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user tickets",
        });
    }
};
exports.getUserTickets = getUserTickets;
const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const { sender } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }
        const oppositeSender = sender === "user" ? "admin" : "user";
        await Message_1.default.updateMany({ ticketId: id, sender: oppositeSender, seen: false }, { seen: true });
        res.json({
            success: true,
            message: "Messages marked as seen",
        });
    }
    catch (error) {
        console.error("Mark messages as seen error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark messages as seen",
        });
    }
};
exports.markMessagesAsSeen = markMessagesAsSeen;
