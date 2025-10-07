"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = void 0;
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("AddressController - Getting addresses for user:", userId);
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("AddressController - User addresses:", user.addresses);
        console.log("AddressController - Addresses length:", user.addresses.length);
        res.json({
            message: "Addresses retrieved successfully",
            addresses: user.addresses,
        });
    }
    catch (error) {
        console.error("Error getting addresses:", error);
        res
            .status(500)
            .json({ message: "Error retrieving addresses", error: error.message });
    }
};
exports.getAddresses = getAddresses;
const addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, name, phone, street, city, state, zip, country, is_default } = req.body;
        if (!type ||
            !name ||
            !phone ||
            !street ||
            !city ||
            !state ||
            !zip ||
            !country) {
            return res
                .status(400)
                .json({ message: "All address fields are required" });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (is_default) {
            user.addresses.forEach((address) => {
                address.is_default = false;
            });
        }
        const newAddress = {
            address_id: new mongoose_1.default.Types.ObjectId(),
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
    }
    catch (error) {
        console.error("Error adding address:", error);
        res
            .status(500)
            .json({ message: "Error adding address", error: error.message });
    }
};
exports.addAddress = addAddress;
const updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;
        const { type, name, phone, street, city, state, zip, country, is_default } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const addressIndex = user.addresses.findIndex((address) => address.address_id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: "Address not found" });
        }
        if (is_default) {
            user.addresses.forEach((address, index) => {
                if (index !== addressIndex) {
                    address.is_default = false;
                }
            });
        }
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
    }
    catch (error) {
        console.error("Error updating address:", error);
        res
            .status(500)
            .json({ message: "Error updating address", error: error.message });
    }
};
exports.updateAddress = updateAddress;
const deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const addressIndex = user.addresses.findIndex((address) => address.address_id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: "Address not found" });
        }
        user.addresses.splice(addressIndex, 1);
        await user.save();
        res.json({
            message: "Address deleted successfully",
            addresses: user.addresses,
        });
    }
    catch (error) {
        console.error("Error deleting address:", error);
        res
            .status(500)
            .json({ message: "Error deleting address", error: error.message });
    }
};
exports.deleteAddress = deleteAddress;
const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const addressIndex = user.addresses.findIndex((address) => address.address_id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: "Address not found" });
        }
        user.addresses.forEach((address) => {
            address.is_default = false;
        });
        user.addresses[addressIndex].is_default = true;
        await user.save();
        res.json({
            message: "Default address set successfully",
            addresses: user.addresses,
        });
    }
    catch (error) {
        console.error("Error setting default address:", error);
        res
            .status(500)
            .json({ message: "Error setting default address", error: error.message });
    }
};
exports.setDefaultAddress = setDefaultAddress;
