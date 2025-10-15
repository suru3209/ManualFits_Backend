import { Router } from "express";
import {
  // Gift Cards
  getGiftCards,
  addGiftCard,
  updateGiftCard,
  deleteGiftCard,
  // UPI
  getUPI,
  addUPI,
  updateUPI,
  deleteUPI,
  // Cards
  getCards,
  addCard,
  updateCard,
  deleteCard,
} from "../controllers/paymentController";
import { authMiddleware } from "../middleware/authMiddleware";
import User from "../models/User";

const router = Router();

// All payment routes require authentication
router.use(authMiddleware);

// Gift Cards Routes
router.get("/gift-cards", getGiftCards);
router.post("/gift-cards", addGiftCard);
router.put("/gift-cards/:id", updateGiftCard);
router.delete("/gift-cards/:id", deleteGiftCard);

// UPI Routes
router.get("/upi", getUPI);
router.post("/upi", addUPI);
router.put("/upi/:upiId", updateUPI);
router.delete("/upi/:upiId", deleteUPI);
router.patch("/upi/:upiId/default", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { upiId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove default from all UPIs
    user.saved_payments.upi.forEach((upi: any) => {
      upi.is_default = false;
    });

    // Set this UPI as default
    const upiIndex = user.saved_payments.upi.findIndex(
      (upi: any) => upi.upi_id === upiId
    );

    if (upiIndex === -1) {
      return res.status(404).json({ message: "UPI not found" });
    }

    user.saved_payments.upi[upiIndex].is_default = true;
    await user.save();

    res.json({
      message: "Default UPI set successfully",
      upi: user.saved_payments.upi[upiIndex],
    });
  } catch (error) {
    console.error("Error setting default UPI:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Cards Routes
router.get("/cards", getCards);
router.post("/cards", addCard);
router.put("/cards/:id", updateCard);
router.delete("/cards/:id", deleteCard);
router.patch("/cards/:id/default", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove default from all cards
    user.saved_payments.cards.forEach((card: any) => {
      card.is_default = false;
    });

    // Set this card as default
    const cardIndex = user.saved_payments.cards.findIndex(
      (card: any) => card.card_id.toString() === id
    );

    if (cardIndex === -1) {
      return res.status(404).json({ message: "Card not found" });
    }

    user.saved_payments.cards[cardIndex].is_default = true;
    await user.save();

    res.json({
      message: "Default card set successfully",
      card: user.saved_payments.cards[cardIndex],
    });
  } catch (error) {
    console.error("Error setting default card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
