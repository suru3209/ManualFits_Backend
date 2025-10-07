import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  senderType: "user" | "admin";
  message: string;
  messageType: "text" | "image" | "file";
  attachments?: {
    type: "image" | "file";
    url: string;
    filename?: string;
    size?: number;
  }[];
  orderReference?: Types.ObjectId; // Reference to order if chat is order-related
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId; // Reference to User model
  admin?: Types.ObjectId; // Reference to Admin model (optional, for assigned chats)
  order?: Types.ObjectId; // Reference to Order model (optional, for order-specific chats)
  subject: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  category:
    | "general"
    | "order"
    | "product"
    | "payment"
    | "technical"
    | "refund";
  lastMessage?: Types.ObjectId; // Reference to last message
  lastMessageAt?: Date;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema({
  type: { type: String, enum: ["image", "file"], required: true },
  url: { type: String, required: true },
  filename: String,
  size: Number,
});

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: Schema.Types.ObjectId, required: true }, // Can be User or Admin ID
    senderType: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    attachments: [AttachmentSchema],
    orderReference: { type: Schema.Types.ObjectId, ref: "Order" },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

const ChatSchema = new Schema<IChat>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    admin: { type: Schema.Types.ObjectId, ref: "Admin" }, // Optional admin assignment
    order: { type: Schema.Types.ObjectId, ref: "Order" }, // Optional order reference
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
    lastMessage: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for better performance
ChatSchema.index({ user: 1, isActive: 1 });
ChatSchema.index({ admin: 1, status: 1 });
ChatSchema.index({ order: 1 });
ChatSchema.index({ status: 1, priority: 1 });
ChatSchema.index({ lastMessageAt: -1 });

ChatMessageSchema.index({ chat: 1, createdAt: 1 });
ChatMessageSchema.index({ sender: 1, senderType: 1 });
ChatMessageSchema.index({ orderReference: 1 });

export const Chat = model<IChat>("Chat", ChatSchema);
export const ChatMessage = model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
