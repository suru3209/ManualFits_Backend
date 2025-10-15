"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoReplyService = void 0;
const Ticket_1 = __importDefault(require("../models/Ticket"));
const Message_1 = __importDefault(require("../models/Message"));
class AutoReplyService {
    static async sendWelcomeMessage(ticketId) {
        const welcomeMessage = new Message_1.default({
            ticketId,
            sender: "admin",
            message: "👋 Hello! Thanks for reaching out to Manualfits support. We'll be with you shortly.",
            messageType: "auto-reply",
        });
        await welcomeMessage.save();
    }
    static async checkAndSendLateResponseMessage(ticketId) {
        const ticket = await Ticket_1.default.findById(ticketId);
        if (!ticket)
            return;
        const lastMessage = await Message_1.default.findOne({ ticketId })
            .sort({ timestamp: -1 });
        if (!lastMessage || lastMessage.sender !== "user")
            return;
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        if (lastMessage.timestamp < oneMinuteAgo) {
            const existingLateResponse = await Message_1.default.findOne({
                ticketId,
                message: { $regex: /Our support team is reviewing your query/i },
                messageType: "auto-reply"
            });
            if (!existingLateResponse) {
                const lateResponseMessage = new Message_1.default({
                    ticketId,
                    sender: "admin",
                    message: "⏳ Our support team is reviewing your query. Please stay connected.",
                    messageType: "auto-reply",
                });
                await lateResponseMessage.save();
            }
        }
    }
    static async sendFeedbackRequest(ticketId) {
        const feedbackMessage = new Message_1.default({
            ticketId,
            sender: "admin",
            message: "💬 Please rate your chat experience (1–5 stars) and add a short comment.",
            messageType: "auto-reply",
        });
        await feedbackMessage.save();
    }
    static startLateResponseChecker() {
        setInterval(async () => {
            try {
                const openTickets = await Ticket_1.default.find({
                    status: { $in: ["open", "in-progress"] },
                    lastMessageAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
                });
                for (const ticket of openTickets) {
                    await this.checkAndSendLateResponseMessage(ticket._id.toString());
                }
            }
            catch (error) {
                console.error("Error in late response checker:", error);
            }
        }, 30000);
    }
    static async notifyAdminsNewTicket(ticket) {
    }
    static async notifyUserTicketUpdate(ticket, status) {
        let message = "";
        switch (status) {
            case "in-progress":
                message = "✅ Your ticket is now being handled by our support team.";
                break;
            case "closed":
                message = "✅ Your ticket has been resolved. Thank you for contacting us!";
                break;
            default:
                message = `📋 Your ticket status has been updated to: ${status}`;
        }
        const statusMessage = new Message_1.default({
            ticketId: ticket._id,
            sender: "admin",
            message,
            messageType: "system",
        });
        await statusMessage.save();
    }
    static async sendFollowUpEmail(ticket) {
    }
    static getQuickReplies() {
        return [
            "Thank you for your patience.",
            "We're checking this issue.",
            "Your order is being processed.",
            "We'll get back to you shortly.",
            "Thank you for contacting us.",
            "I understand your concern.",
            "Let me check this for you.",
            "I'll escalate this to our technical team.",
            "Your request has been noted.",
            "Is there anything else I can help you with?",
        ];
    }
    static async generateCategoryResponse(ticket, message) {
        const lowerMessage = message.toLowerCase();
        switch (ticket.category) {
            case "order":
                if (lowerMessage.includes("track") || lowerMessage.includes("shipping")) {
                    return "I'll help you track your order. Please provide your order number if you haven't already.";
                }
                if (lowerMessage.includes("cancel") || lowerMessage.includes("refund")) {
                    return "I understand you'd like to cancel or get a refund. Let me check your order details.";
                }
                break;
            case "technical":
                if (lowerMessage.includes("login") || lowerMessage.includes("password")) {
                    return "I'll help you with your login issue. Let me guide you through the password reset process.";
                }
                if (lowerMessage.includes("bug") || lowerMessage.includes("error")) {
                    return "I'll report this technical issue to our development team for immediate attention.";
                }
                break;
            case "billing":
                if (lowerMessage.includes("charge") || lowerMessage.includes("payment")) {
                    return "I'll review your billing inquiry and provide you with the necessary information.";
                }
                break;
            case "return":
                if (lowerMessage.includes("return") || lowerMessage.includes("exchange")) {
                    return "I'll help you with your return or exchange request. Let me check our return policy for your item.";
                }
                break;
        }
        return null;
    }
}
exports.AutoReplyService = AutoReplyService;
