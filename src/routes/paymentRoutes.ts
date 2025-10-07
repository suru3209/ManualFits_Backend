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

// Cards Routes
router.get("/cards", getCards);
router.post("/cards", addCard);
router.put("/cards/:id", updateCard);
router.delete("/cards/:id", deleteCard);

export default router;
