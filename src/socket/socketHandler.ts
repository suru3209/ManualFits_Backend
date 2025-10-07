import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { Chat, ChatMessage } from "../models/Chat";
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

      if (!token) {
        console.log("Socket authentication failed: No token provided");
        return null;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-here"
      ) as any;

      console.log("Socket authentication - Decoded token:", {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
      });

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
          username: admin.username,
        };
      } else {
        // Regular user token
        const user = await User.findById(decoded.id);
        if (!user) return null;

        return {
          userId: user._id.toString(),
          userType: "user",
          username: user.username,
        };
      }
    } catch (error) {
      console.error("Socket authentication error:", error);
      return null;
    }
  }

  private setupSocketHandlers() {
    this.io.on("connection", async (socket) => {
      console.log("New socket connection:", socket.id);

      // Authenticate user
      const auth = await this.authenticateSocket(socket);
      if (!auth) {
        socket.emit("auth_error", { message: "Authentication failed" });
        socket.disconnect();
        return;
      }

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
      }

      // Handle joining chat rooms
      socket.on("join_chat", (chatId: string) => {
        socket.join(`chat_${chatId}`);
        console.log(`User ${auth.username} joined chat ${chatId}`);
      });

      // Handle leaving chat rooms
      socket.on("leave_chat", (chatId: string) => {
        socket.leave(`chat_${chatId}`);
        console.log(`User ${auth.username} left chat ${chatId}`);
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

            console.log(`Message sent in chat ${chatId} by ${auth.username}`);
          } catch (error) {
            console.error("Error sending message:", error);
            socket.emit("error", { message: "Failed to send message" });
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

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User ${auth.username} disconnected`);
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
