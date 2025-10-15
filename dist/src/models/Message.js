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
const AttachmentSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
});
const MessageSchema = new mongoose_1.Schema({
    ticketId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true,
    },
    sender: {
        type: String,
        enum: ["user", "admin"],
        required: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Message",
    },
}, { timestamps: true });
MessageSchema.index({ ticketId: 1, timestamp: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ seen: 1 });
MessageSchema.index({ messageType: 1 });
exports.default = mongoose_1.default.models.Message ||
    mongoose_1.default.model("Message", MessageSchema);
