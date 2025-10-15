// Simple test to verify support system components work
import mongoose from "mongoose";
import Ticket from "./models/Ticket";
import Message from "./models/Message";

// Test basic model creation
async function testSupportModels() {
  try {
    // Test ticket creation
    const testTicket = new Ticket({
      userEmail: "test@example.com",
      subject: "Test Ticket",
      status: "open",
      priority: "medium",
      category: "general",
    });


    // Test message creation
    const testMessage = new Message({
      ticketId: testTicket._id,
      sender: "user",
      message: "Test message",
      messageType: "text",
    });


    return { ticket: testTicket, message: testMessage };
  } catch (error) {
    console.error("❌ Model creation failed:", error);
    throw error;
  }
}

// Test auto-reply service
async function testAutoReplyService() {
  try {
    const { AutoReplyService } = await import("./utils/autoReplyService");
    
    
    const quickReplies = AutoReplyService.getQuickReplies();
    
    return true;
  } catch (error) {
    console.error("❌ AutoReplyService test failed:", error);
    throw error;
  }
}

// Run tests
async function runTests() {
  
  try {
    await testSupportModels();
    await testAutoReplyService();
    
  } catch (error) {
    console.error("\n❌ Tests failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

export { testSupportModels, testAutoReplyService };
