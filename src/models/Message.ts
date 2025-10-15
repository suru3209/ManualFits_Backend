import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  sender: "user" | "admin";
  senderId?: mongoose.Types.ObjectId; // Reference to User or Admin
  message: string;
  timestamp: Date;
  seen: boolean;
  messageType: "text" | "auto-reply" | "system" | "file" | "image";
  attachments?: Array<{
    url: string;
    filename: string;
    mimetype: string;
  }>;
  editedAt?: Date;
  replyTo?: mongoose.Types.ObjectId; // For threaded conversations
}

const AttachmentSchema = new Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
});

const MessageSchema = new Schema<IMessage>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      refPath: "senderModel",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: ["text", "auto-reply", "system", "file", "image"],
      default: "text",
    },
    attachments: [AttachmentSchema],
    editedAt: Date,
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
MessageSchema.index({ ticketId: 1, timestamp: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ seen: 1 });
MessageSchema.index({ messageType: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
