import Ticket from "../models/Ticket";
import Message from "../models/Message";

export class AutoReplyService {
  // Auto-welcome message when ticket is created
  static async sendWelcomeMessage(ticketId: string): Promise<void> {
    const welcomeMessage = new Message({
      ticketId,
      sender: "admin",
      message: "👋 Hello! Thanks for reaching out to Manualfits support. We'll be with you shortly.",
      messageType: "auto-reply",
    });

    await welcomeMessage.save();
  }

  // Late response message if no admin reply within specified time
  static async checkAndSendLateResponseMessage(ticketId: string): Promise<void> {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return;

    // Check if last message was from user and no admin has replied
    const lastMessage = await Message.findOne({ ticketId })
      .sort({ timestamp: -1 });

    if (!lastMessage || lastMessage.sender !== "user") return;

    // Check if more than 1 minute has passed since last user message
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    if (lastMessage.timestamp < oneMinuteAgo) {
      // Check if we already sent a late response message
      const existingLateResponse = await Message.findOne({
        ticketId,
        message: { $regex: /Our support team is reviewing your query/i },
        messageType: "auto-reply"
      });

      if (!existingLateResponse) {
        const lateResponseMessage = new Message({
          ticketId,
          sender: "admin",
          message: "⏳ Our support team is reviewing your query. Please stay connected.",
          messageType: "auto-reply",
        });

        await lateResponseMessage.save();
      }
    }
  }

  // Send feedback request when ticket is closed
  static async sendFeedbackRequest(ticketId: string): Promise<void> {
    const feedbackMessage = new Message({
      ticketId,
      sender: "admin",
      message: "💬 Please rate your chat experience (1–5 stars) and add a short comment.",
      messageType: "auto-reply",
    });

    await feedbackMessage.save();
  }

  // Schedule periodic checks for late response messages
  static startLateResponseChecker(): void {
    setInterval(async () => {
      try {
        // Find open tickets with recent user messages
        const openTickets = await Ticket.find({ 
          status: { $in: ["open", "in-progress"] },
          lastMessageAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
        });

        for (const ticket of openTickets) {
          await this.checkAndSendLateResponseMessage(ticket._id.toString());
        }
      } catch (error) {
        console.error("Error in late response checker:", error);
      }
    }, 30000); // Check every 30 seconds
  }

  // Send notification to admins about new tickets
  static async notifyAdminsNewTicket(ticket: any): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll just log it
    
    // You could add:
    // - Email notifications
    // - Push notifications
    // - Slack/Discord webhooks
    // - SMS notifications for urgent tickets
  }

  // Send notification to user about ticket status change
  static async notifyUserTicketUpdate(ticket: any, status: string): Promise<void> {
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

    const statusMessage = new Message({
      ticketId: ticket._id,
      sender: "admin",
      message,
      messageType: "system",
    });

    await statusMessage.save();
  }

  // Send follow-up email for closed tickets (optional)
  static async sendFollowUpEmail(ticket: any): Promise<void> {
    // This would integrate with your email service
    // For now, we'll just log it
    
    // You could add:
    // - Email service integration (AWS SES, SendGrid, etc.)
    // - Email templates
    // - Personalized content based on ticket category
  }

  // Get quick reply templates
  static getQuickReplies(): string[] {
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

  // Generate automated response based on ticket category
  static async generateCategoryResponse(ticket: any, message: string): Promise<string | null> {
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
