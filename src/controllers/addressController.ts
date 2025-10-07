import { Request, Response } from "express";
import User from "../models/User";
import mongoose from "mongoose";

// Get user's addresses
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    console.log("AddressController - Getting addresses for user:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("AddressController - User addresses:", user.addresses);
    console.log("AddressController - Addresses length:", user.addresses.length);

    res.json({
      message: "Addresses retrieved successfully",
      addresses: user.addresses,
    });
  } catch (error: any) {
    console.error("Error getting addresses:", error);
    res
      .status(500)
      .json({ message: "Error retrieving addresses", error: error.message });
  }
};

// Add new address
export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, name, phone, street, city, state, zip, country, is_default } =
      req.body;

    if (
      !type ||
      !name ||
      !phone ||
      !street ||
      !city ||
      !state ||
      !zip ||
      !country
    ) {
      return res
        .status(400)
        .json({ message: "All address fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If this is set as default, remove default from other addresses
    if (is_default) {
      user.addresses.forEach((address: any) => {
        address.is_default = false;
      });
    }

    // Create new address
    const newAddress = {
      address_id: new mongoose.Types.ObjectId(),
      type,
      name,
      phone,
      street,
      city,
      state,
      zip,
      country,
      is_default: is_default || false,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error: any) {
    console.error("Error adding address:", error);
    res
      .status(500)
      .json({ message: "Error adding address", error: error.message });
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { addressId } = req.params;
    const { type, name, phone, street, city, state, zip, country, is_default } =
      req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (address: any) => address.address_id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If this is set as default, remove default from other addresses
    if (is_default) {
      user.addresses.forEach((address: any, index: number) => {
        if (index !== addressIndex) {
          address.is_default = false;
        }
      });
    }

    // Update address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      type,
      name,
      phone,
      street,
      city,
      state,
      zip,
      country,
      is_default: is_default || false,
    };

    await user.save();

    res.json({
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error: any) {
    console.error("Error updating address:", error);
    res
      .status(500)
      .json({ message: "Error updating address", error: error.message });
  }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (address: any) => address.address_id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove address
    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error: any) {
    console.error("Error deleting address:", error);
    res
      .status(500)
      .json({ message: "Error deleting address", error: error.message });
  }
};

// Set default address
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (address: any) => address.address_id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove default from all addresses
    user.addresses.forEach((address: any) => {
      address.is_default = false;
    });

    // Set this address as default
    user.addresses[addressIndex].is_default = true;
    await user.save();

    res.json({
      message: "Default address set successfully",
      addresses: user.addresses,
    });
  } catch (error: any) {
    console.error("Error setting default address:", error);
    res
      .status(500)
      .json({ message: "Error setting default address", error: error.message });
  }
};
