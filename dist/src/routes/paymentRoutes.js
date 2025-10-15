"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get("/gift-cards", paymentController_1.getGiftCards);
router.post("/gift-cards", paymentController_1.addGiftCard);
router.put("/gift-cards/:id", paymentController_1.updateGiftCard);
router.delete("/gift-cards/:id", paymentController_1.deleteGiftCard);
router.get("/upi", paymentController_1.getUPI);
router.post("/upi", paymentController_1.addUPI);
router.put("/upi/:upiId", paymentController_1.updateUPI);
router.delete("/upi/:upiId", paymentController_1.deleteUPI);
router.patch("/upi/:upiId/default", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { upiId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.saved_payments.upi.forEach((upi) => {
            upi.is_default = false;
        });
        const upiIndex = user.saved_payments.upi.findIndex((upi) => upi.upi_id === upiId);
        if (upiIndex === -1) {
            return res.status(404).json({ message: "UPI not found" });
        }
        user.saved_payments.upi[upiIndex].is_default = true;
        await user.save();
        res.json({
            message: "Default UPI set successfully",
            upi: user.saved_payments.upi[upiIndex],
        });
    }
    catch (error) {
        console.error("Error setting default UPI:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/cards", paymentController_1.getCards);
router.post("/cards", paymentController_1.addCard);
router.put("/cards/:id", paymentController_1.updateCard);
router.delete("/cards/:id", paymentController_1.deleteCard);
router.patch("/cards/:id/default", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.saved_payments.cards.forEach((card) => {
            card.is_default = false;
        });
        const cardIndex = user.saved_payments.cards.findIndex((card) => card.card_id.toString() === id);
        if (cardIndex === -1) {
            return res.status(404).json({ message: "Card not found" });
        }
        user.saved_payments.cards[cardIndex].is_default = true;
        await user.save();
        res.json({
            message: "Default card set successfully",
            card: user.saved_payments.cards[cardIndex],
        });
    }
    catch (error) {
        console.error("Error setting default card:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
