import { Response } from "express";
import User, { IUser } from "../models/User";
import mongoose from "mongoose";

// Gift Cards Controller
export const getGiftCards = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select(
      "saved_payments.gift_cards"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ gift_cards: user.saved_payments.gift_cards });
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGiftCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { code, balance, expiry_date, is_active } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newGiftCard = {
      giftcard_id: new mongoose.Types.ObjectId(),
      code,
      balance: parseFloat(balance),
      expiry_date: new Date(expiry_date),
      is_active: is_active !== false,
    };

    user.saved_payments.gift_cards.push(newGiftCard);
    await user.save();

    res.status(201).json({
      message: "Gift card added successfully",
      gift_card: newGiftCard,
    });
  } catch (error) {
    console.error("Error adding gift card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGiftCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { code, balance, expiry_date, is_active } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const giftCardIndex = user.saved_payments.gift_cards.findIndex(
      (gc: any) => gc.giftcard_id.toString() === id
    );

    if (giftCardIndex === -1) {
      return res.status(404).json({ message: "Gift card not found" });
    }

    user.saved_payments.gift_cards[giftCardIndex] = {
      ...user.saved_payments.gift_cards[giftCardIndex],
      code,
      balance: parseFloat(balance),
      expiry_date: new Date(expiry_date),
      is_active: is_active !== false,
    };

    await user.save();

    res.json({
      message: "Gift card updated successfully",
      gift_card: user.saved_payments.gift_cards[giftCardIndex],
    });
  } catch (error) {
    console.error("Error updating gift card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGiftCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const giftCardIndex = user.saved_payments.gift_cards.findIndex(
      (gc: any) => gc.giftcard_id.toString() === id
    );

    if (giftCardIndex === -1) {
      return res.status(404).json({ message: "Gift card not found" });
    }

    user.saved_payments.gift_cards.splice(giftCardIndex, 1);
    await user.save();

    res.json({ message: "Gift card deleted successfully" });
  } catch (error) {
    console.error("Error deleting gift card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPI Controller
export const getUPI = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select("saved_payments.upi");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ upi: user.saved_payments.upi });
  } catch (error) {
    console.error("Error fetching UPI:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addUPI = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { upi_id, name, is_default } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If setting as default, remove default from other UPIs
    if (is_default) {
      user.saved_payments.upi.forEach((upi: any) => {
        upi.is_default = false;
      });
    }

    const newUPI = {
      upi_id,
      name,
      is_default: is_default || false,
    };

    user.saved_payments.upi.push(newUPI);
    await user.save();

    res.status(201).json({
      message: "UPI added successfully",
      upi: newUPI,
    });
  } catch (error) {
    console.error("Error adding UPI:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUPI = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { upiId } = req.params;
    const { upi_id, name, is_default } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const upiIndex = user.saved_payments.upi.findIndex(
      (upi: any) => upi.upi_id === upiId
    );

    if (upiIndex === -1) {
      return res.status(404).json({ message: "UPI not found" });
    }

    // If setting as default, remove default from other UPIs
    if (is_default) {
      user.saved_payments.upi.forEach((upi: any, index: any) => {
        if (index !== upiIndex) {
          upi.is_default = false;
        }
      });
    }

    user.saved_payments.upi[upiIndex] = {
      ...user.saved_payments.upi[upiIndex],
      upi_id,
      name,
      is_default: is_default || false,
    };

    await user.save();

    res.json({
      message: "UPI updated successfully",
      upi: user.saved_payments.upi[upiIndex],
    });
  } catch (error) {
    console.error("Error updating UPI:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUPI = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { upiId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const upiIndex = user.saved_payments.upi.findIndex(
      (upi: any) => upi.upi_id === upiId
    );

    if (upiIndex === -1) {
      return res.status(404).json({ message: "UPI not found" });
    }

    user.saved_payments.upi.splice(upiIndex, 1);
    await user.save();

    res.json({ message: "UPI deleted successfully" });
  } catch (error) {
    console.error("Error deleting UPI:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cards Controller
export const getCards = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select("saved_payments.cards");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ cards: user.saved_payments.cards });
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      card_type,
      brand,
      last4,
      expiry_month,
      expiry_year,
      cardholder_name,
      is_default,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If setting as default, remove default from other cards
    if (is_default) {
      user.saved_payments.cards.forEach((card: any) => {
        card.is_default = false;
      });
    }

    const newCard = {
      card_id: new mongoose.Types.ObjectId(),
      card_type,
      brand,
      last4,
      expiry_month: parseInt(expiry_month),
      expiry_year: parseInt(expiry_year),
      cardholder_name,
      is_default: is_default || false,
    };

    user.saved_payments.cards.push(newCard);
    await user.save();

    res.status(201).json({
      message: "Card added successfully",
      card: newCard,
    });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const {
      card_type,
      brand,
      last4,
      expiry_month,
      expiry_year,
      cardholder_name,
      is_default,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cardIndex = user.saved_payments.cards.findIndex(
      (card: any) => card.card_id.toString() === id
    );

    if (cardIndex === -1) {
      return res.status(404).json({ message: "Card not found" });
    }

    // If setting as default, remove default from other cards
    if (is_default) {
      user.saved_payments.cards.forEach((card: any, index: any) => {
        if (index !== cardIndex) {
          card.is_default = false;
        }
      });
    }

    user.saved_payments.cards[cardIndex] = {
      ...user.saved_payments.cards[cardIndex],
      card_type,
      brand,
      last4,
      expiry_month: parseInt(expiry_month),
      expiry_year: parseInt(expiry_year),
      cardholder_name,
      is_default: is_default || false,
    };

    await user.save();

    res.json({
      message: "Card updated successfully",
      card: user.saved_payments.cards[cardIndex],
    });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cardIndex = user.saved_payments.cards.findIndex(
      (card: any) => card.card_id.toString() === id
    );

    if (cardIndex === -1) {
      return res.status(404).json({ message: "Card not found" });
    }

    user.saved_payments.cards.splice(cardIndex, 1);
    await user.save();

    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
