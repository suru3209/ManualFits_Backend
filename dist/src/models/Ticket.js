"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const FeedbackSchema = new mongoose_1.Schema({
    rating: { type: Number, min: 1, max: 5 },
    message: { type: String },
    submittedAt: { type: Date, default: Date.now },
});
const TicketSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Order",
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
}, { timestamps: true });
TicketSchema.index({ status: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ assignedAdmin: 1 });
TicketSchema.index({ lastMessageAt: -1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ priority: 1 });
exports.default = mongoose_1.default.models.Ticket ||
    mongoose_1.default.model("Ticket", TicketSchema);
