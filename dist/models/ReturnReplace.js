"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnReplace = void 0;
const mongoose_1 = require("mongoose");
const ReturnReplaceItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    reason: { type: String, required: true },
    quantity: { type: Number, required: true },
}, { _id: false });
const ReturnReplaceSchema = new mongoose_1.Schema({
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    items: [ReturnReplaceItemSchema],
    type: { type: String, enum: ["return", "replace"], required: true },
    status: {
        type: String,
        enum: ["requested", "approved", "rejected", "completed"],
        default: "requested",
    },
}, { timestamps: true });
exports.ReturnReplace = (0, mongoose_1.model)("ReturnReplace", ReturnReplaceSchema);
