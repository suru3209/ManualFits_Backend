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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSupportModels = testSupportModels;
exports.testAutoReplyService = testAutoReplyService;
const Ticket_1 = __importDefault(require("./models/Ticket"));
const Message_1 = __importDefault(require("./models/Message"));
async function testSupportModels() {
    try {
        const testTicket = new Ticket_1.default({
            userEmail: "test@example.com",
            subject: "Test Ticket",
            status: "open",
            priority: "medium",
            category: "general",
        });
        const testMessage = new Message_1.default({
            ticketId: testTicket._id,
            sender: "user",
            message: "Test message",
            messageType: "text",
        });
        return { ticket: testTicket, message: testMessage };
    }
    catch (error) {
        console.error("❌ Model creation failed:", error);
        throw error;
    }
}
async function testAutoReplyService() {
    try {
        const { AutoReplyService } = await Promise.resolve().then(() => __importStar(require("./utils/autoReplyService")));
        const quickReplies = AutoReplyService.getQuickReplies();
        return true;
    }
    catch (error) {
        console.error("❌ AutoReplyService test failed:", error);
        throw error;
    }
}
async function runTests() {
    try {
        await testSupportModels();
        await testAutoReplyService();
    }
    catch (error) {
        console.error("\n❌ Tests failed:", error);
        process.exit(1);
    }
}
if (require.main === module) {
    runTests();
}
