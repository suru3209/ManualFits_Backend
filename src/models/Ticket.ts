import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback {
  rating?: number;
  message?: string;
  submittedAt?: Date;
}

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  subject: string;
  status: "open" | "in-progress" | "closed";
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  feedback?: IFeedback;
  assignedAdmin?: mongoose.Types.ObjectId;
  priority: "low" | "medium" | "high" | "urgent";
  category: "general" | "order" | "technical" | "billing" | "return";
  orderId?: mongoose.Types.ObjectId;
  tags: string[];
}

const FeedbackSchema = new Schema<IFeedback>({
  rating: { type: Number, min: 1, max: 5 },
  message: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

const TicketSchema = new Schema<ITicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    feedback: FeedbackSchema,
    assignedAdmin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["general", "order", "technical", "billing", "return"],
      default: "general",
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// Indexes for better query performance
TicketSchema.index({ status: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ assignedAdmin: 1 });
TicketSchema.index({ lastMessageAt: -1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ priority: 1 });

export default mongoose.models.Ticket ||
  mongoose.model<ITicket>("Ticket", TicketSchema);
