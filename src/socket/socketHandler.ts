import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { Chat, ChatMessage } from "../models/Chat";
import Ticket from "../models/Ticket";
import Message from "../models/Message";
import User from "../models/User";
import Admin from "../models/Admin";

interface AuthenticatedSocket {
  userId: string;
  userType: "user" | "admin";
  username: string;
}

export class SocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private async authenticateSocket(
    socket: any
  ): Promise<AuthenticatedSocket | null> {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      console.log("🔐 Socket authentication attempt:");
      console.log("🔐 Token present:", !!token);
      console.log("🔐 Auth object:", socket.handshake.auth);
      console.log("🔐 Headers:", socket.handshake.headers.authorization);

      if (!token) {
        console.log("❌ No token provided");
        return null;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-here"
      ) as any;

      console.log("🔐 Decoded token:", {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
        exp: decoded.exp,
      });

      // Validate required fields
      if (!decoded.id || !decoded.role) {
        console.log("❌ Missing required fields in token");
        return null;
      }

      // For backward compatibility, if username is missing, try to get it from the user/admin record
      let username = decoded.username;

      // Check if it's an admin token (super_admin, admin, or moderator)
      if (
        decoded.role === "admin" ||
        decoded.role === "super_admin" ||
        decoded.role === "moderator"
      ) {
        const admin = await Admin.findById(decoded.id);
        if (!admin) return null;

        return {
          userId: admin._id.toString(),
          userType: "admin",
          username: username || admin.username,
        };
      } else {
        // Regular user token
        const user = await User.findById(decoded.id);
        if (!user) return null;

        return {
          userId: user._id.toString(),
          userType: "user",
          username: username || user.username,
        };
      }
    } catch (error) {
      console.error("❌ Socket authentication error:", error);
      console.error("❌ Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  private setupSocketHandlers() {
    this.io.on("connection", async (socket) => {
      // Authenticate user
      console.log("🔌 New socket connection attempt");
      const auth = await this.authenticateSocket(socket);
      if (!auth) {
        console.log("❌ Authentication failed, disconnecting socket");
        socket.emit("auth_error", { message: "Authentication failed" });
        socket.disconnect();
        return;
      }

      console.log("✅ Socket authentication successful:", {
        userId: auth.userId,
        userType: auth.userType,
        username: auth.username,
      });

      // Store user connection
      this.connectedUsers.set(socket.id, auth);
      this.userSockets.set(auth.userId, socket.id);

      console.log(
        `User ${auth.username} (${auth.userType}) connected with socket ${socket.id}`
      );

      // Join user to their personal room
      socket.join(`user_${auth.userId}`);

      // Join admin to admin room
      if (auth.userType === "admin") {
        socket.join("admin_room");
        socket.join("support_admin_room");
      }

      // Join user to support room
      if (auth.userType === "user") {
        socket.join("support_user_room");
      }

      // Handle joining chat rooms
      socket.on("join_chat", (chatId: string) => {
        socket.join(`chat_${chatId}`);
      });

      // Handle joining support ticket rooms
      socket.on("join_support_ticket", (ticketId: string) => {
        socket.join(`ticket_${ticketId}`);
        console.log(
          `User ${auth.username} (${auth.userType}) joined support ticket room: ticket_${ticketId}`
        );
      });

      // Handle leaving chat rooms
      socket.on("leave_chat", (chatId: string) => {
        socket.leave(`chat_${chatId}`);
      });

      // Handle leaving support ticket rooms
      socket.on("leave_support_ticket", (ticketId: string) => {
        socket.leave(`ticket_${ticketId}`);
      });

      // Handle sending messages
      socket.on(
        "send_message",
        async (data: {
          chatId: string;
          message: string;
          messageType?: string;
          attachments?: any[];
          orderReference?: string;
        }) => {
          try {
            const {
              chatId,
              message,
              messageType,
              attachments,
              orderReference,
            } = data;

            // Verify chat exists and user has access
            const chat = await Chat.findById(chatId);
            if (!chat) {
              socket.emit("error", { message: "Chat not found" });
              return;
            }

            const hasAccess =
              auth.userType === "admin" || chat.user.toString() === auth.userId;
            if (!hasAccess) {
              socket.emit("error", { message: "Access denied" });
              return;
            }

            // Create message
            const messageData: any = {
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

            // Broadcast message to all users in the chat room
            this.io.to(`chat_${chatId}`).emit("new_message", {
              message: newMessage,
              chatId,
            });

            // Notify user about new message in their personal room
            if (auth.userType === "user") {
              this.io.to("admin_room").emit("new_user_message", {
                chatId,
                message: newMessage,
                userId: auth.userId,
                username: auth.username,
              });
            } else {
              this.io.to(`user_${chat.user}`).emit("new_admin_message", {
                chatId,
                message: newMessage,
                adminUsername: auth.username,
              });
            }
          } catch (error) {
            console.error("Error sending message:", error);
            socket.emit("error", { message: "Failed to send message" });
          }
        }
      );

      // Handle sending support messages
      socket.on(
        "send_support_message",
        async (data: {
          ticketId: string;
          message: string;
          messageType?: string;
        }) => {
          try {
            const { ticketId, message, messageType = "text" } = data;

            // Verify ticket exists and user has access
            const ticket = await Ticket.findById(ticketId);
            if (!ticket) {
              socket.emit("error", { message: "Ticket not found" });
              return;
            }

            const hasAccess =
              auth.userType === "admin" ||
              ticket.userId.toString() === auth.userId;
            if (!hasAccess) {
              socket.emit("error", { message: "Access denied" });
              return;
            }

            // Create message
            const messageData: any = {
              ticketId,
              sender: auth.userType,
              senderId: auth.userId,
              message,
              messageType,
            };

            const newMessage = new Message(messageData);
            await newMessage.save();

            // Update ticket with last message time
            ticket.lastMessageAt = new Date();
            await ticket.save();

            // Populate message data
            await newMessage.populate([
              { path: "senderId", select: "username email" },
            ]);

            // Broadcast message to all users in the ticket room
            console.log(
              `Broadcasting support message to room: ticket_${ticketId}`
            );
            this.io.to(`ticket_${ticketId}`).emit("new_support_message", {
              message: newMessage,
              ticketId,
            });

            // Notify user about new message
            if (auth.userType === "user") {
              this.io
                .to("support_admin_room")
                .emit("new_user_support_message", {
                  ticketId,
                  message: newMessage,
                  userId: auth.userId,
                  username: auth.username,
                });
            } else {
              this.io
                .to(`user_${ticket.userId}`)
                .emit("new_admin_support_message", {
                  ticketId,
                  message: newMessage,
                  adminUsername: auth.username,
                });
            }

            console.log(
              `Support message sent in ticket ${ticketId} by ${auth.username}`
            );
          } catch (error) {
            console.error("Error sending support message:", error);
            socket.emit("error", { message: "Failed to send support message" });
          }
        }
      );

      // Handle typing indicators
      socket.on("typing_start", (chatId: string) => {
        socket.to(`chat_${chatId}`).emit("user_typing", {
          userId: auth.userId,
          username: auth.username,
          userType: auth.userType,
        });
      });

      socket.on("typing_stop", (chatId: string) => {
        socket.to(`chat_${chatId}`).emit("user_stopped_typing", {
          userId: auth.userId,
          username: auth.username,
          userType: auth.userType,
        });
      });

      // Handle support typing indicators
      socket.on("support_typing_start", (ticketId: string) => {
        socket.to(`ticket_${ticketId}`).emit("support_user_typing", {
          userId: auth.userId,
          username: auth.username,
          userType: auth.userType,
        });
      });

      socket.on("support_typing_stop", (ticketId: string) => {
        socket.to(`ticket_${ticketId}`).emit("support_user_stopped_typing", {
          userId: auth.userId,
          username: auth.username,
          userType: auth.userType,
        });
      });

      // Handle message read status
      socket.on("mark_messages_read", async (chatId: string) => {
        try {
          await ChatMessage.updateMany(
            {
              chat: chatId,
              sender: { $ne: auth.userId },
              isRead: false,
            },
            {
              isRead: true,
              readAt: new Date(),
            }
          );

          // Notify other users in the chat that messages were read
          socket.to(`chat_${chatId}`).emit("messages_read", {
            userId: auth.userId,
            username: auth.username,
            userType: auth.userType,
          });
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      });

      // Handle support message read status
      socket.on("mark_support_messages_read", async (ticketId: string) => {
        try {
          const oppositeSender = auth.userType === "user" ? "admin" : "user";
          await Message.updateMany(
            {
              ticketId,
              sender: oppositeSender,
              seen: false,
            },
            {
              seen: true,
            }
          );

          // Notify other users in the ticket that messages were read
          socket.to(`ticket_${ticketId}`).emit("support_messages_read", {
            userId: auth.userId,
            username: auth.username,
            userType: auth.userType,
          });
        } catch (error) {
          console.error("Error marking support messages as read:", error);
        }
      });

      // Handle chat status updates (admin only)
      socket.on(
        "update_chat_status",
        async (data: {
          chatId: string;
          status: string;
          priority?: string;
          adminId?: string;
        }) => {
          if (auth.userType !== "admin") {
            socket.emit("error", { message: "Access denied" });
            return;
          }

          try {
            const { chatId, status, priority, adminId } = data;
            const chat = await Chat.findById(chatId);

            if (!chat) {
              socket.emit("error", { message: "Chat not found" });
              return;
            }

            if (status)
              chat.status = status as
                | "open"
                | "in_progress"
                | "resolved"
                | "closed";
            if (priority)
              chat.priority = priority as "low" | "medium" | "high" | "urgent";
            if (adminId) chat.admin = adminId as any;

            await chat.save();

            // Notify all users in the chat about status update
            this.io.to(`chat_${chatId}`).emit("chat_status_updated", {
              chatId,
              status: chat.status,
              priority: chat.priority,
              adminId: chat.admin,
            });

            // Notify user about status change
            this.io.to(`user_${chat.user}`).emit("chat_status_changed", {
              chatId,
              status: chat.status,
              priority: chat.priority,
            });

            console.log(
              `Chat ${chatId} status updated by admin ${auth.username}`
            );
          } catch (error) {
            console.error("Error updating chat status:", error);
            socket.emit("error", { message: "Failed to update chat status" });
          }
        }
      );

      // Handle support ticket status updates (admin only)
      socket.on(
        "update_support_ticket_status",
        async (data: {
          ticketId: string;
          status: string;
          priority?: string;
          assignedAdmin?: string;
        }) => {
          if (auth.userType !== "admin") {
            socket.emit("error", { message: "Access denied" });
            return;
          }

          try {
            const { ticketId, status, priority, assignedAdmin } = data;
            const ticket = await Ticket.findById(ticketId);

            if (!ticket) {
              socket.emit("error", { message: "Ticket not found" });
              return;
            }

            if (status)
              ticket.status = status as "open" | "in-progress" | "closed";
            if (priority)
              ticket.priority = priority as
                | "low"
                | "medium"
                | "high"
                | "urgent";
            if (assignedAdmin) ticket.assignedAdmin = assignedAdmin as any;

            await ticket.save();

            // Notify all users in the ticket about status update
            this.io
              .to(`ticket_${ticketId}`)
              .emit("support_ticket_status_updated", {
                ticketId,
                status: ticket.status,
                priority: ticket.priority,
                assignedAdmin: ticket.assignedAdmin,
              });

            // Notify user about status change
            this.io
              .to(`user_${ticket.userId}`)
              .emit("support_ticket_status_changed", {
                ticketId,
                status: ticket.status,
                priority: ticket.priority,
              });

            // If closing ticket, send feedback request
            if (status === "closed") {
              const feedbackMessage = new Message({
                ticketId,
                sender: "admin",
                message:
                  "💬 Please rate your chat experience (1–5 stars) and add a short comment.",
                messageType: "auto-reply",
              });

              await feedbackMessage.save();

              this.io.to(`ticket_${ticketId}`).emit("new_support_message", {
                message: feedbackMessage,
                ticketId,
              });
            }

            console.log(
              `Support ticket ${ticketId} status updated by admin ${auth.username}`
            );
          } catch (error) {
            console.error("Error updating support ticket status:", error);
            socket.emit("error", { message: "Failed to update ticket status" });
          }
        }
      );

      // Handle user closing ticket
      socket.on("user_closed_ticket", async (data: any) => {
        // Broadcast to admin room that user closed the ticket
        socket.to("support_admin_room").emit("user_closed_ticket", {
          ticketId: data.ticketId,
          userId: data.userId,
          message: data.message,
          closedBy: auth.username,
        });

        console.log(
          `Broadcasted user_closed_ticket to admin room for ticket: ${data.ticketId}`
        );
      });

      // Handle auto-close due to inactivity
      socket.on("ticket_auto_close", async (data: any) => {
        try {
          const { ticketId, reason, inactiveMinutes } = data;

          // Broadcast to admin room about auto-closed ticket
          socket.to("support_admin_room").emit("ticket_auto_closed", {
            ticketId,
            userId: auth.userId,
            username: auth.username,
            reason,
            inactiveMinutes,
            timestamp: new Date(),
          });

          console.log(
            `🕒 Ticket ${ticketId} auto-closed due to inactivity (${inactiveMinutes} minutes)`
          );
        } catch (error) {
          console.error("Error handling auto-close event:", error);
        }
      });

      // Handle test connection
      socket.on("test_connection", (data: any) => {
        socket.emit("test_connection_response", {
          received: true,
          timestamp: new Date(),
        });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        this.connectedUsers.delete(socket.id);
        this.userSockets.delete(auth.userId);
      });
    });
  }

  // Method to get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Method to get online users
  getOnlineUsers(): AuthenticatedSocket[] {
    return Array.from(this.connectedUsers.values());
  }

  // Method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Method to send notification to specific user
  sendNotificationToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Method to broadcast to all admins
  broadcastToAdmins(event: string, data: any) {
    this.io.to("admin_room").emit(event, data);
  }

  // Method to broadcast to all users
  broadcastToUsers(event: string, data: any) {
    this.io.to("user_room").emit(event, data);
  }
}
