"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const OrderItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    size: { type: String },
    color: { type: String },
});
const ShippingAddressSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
});
const OrderSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    utrNumber: { type: String },
    status: {
        type: String,
        enum: [
            "pending",
            "delivered",
            "cancelled",
            "shipped",
            "returned",
            "replaced",
            "refunded",
            "return/replace processing",
        ],
        default: "pending",
    },
}, { timestamps: true });
exports.Order = (0, mongoose_1.model)("Order", OrderSchema);
