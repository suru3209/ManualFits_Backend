"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnReplaceOrder = exports.cancelOrder = exports.updateOrderStatus = exports.createOrder = exports.getOrder = exports.getOrders = void 0;
const Order_1 = require("../models/Order");
const ProductModal_1 = __importDefault(require("../models/ProductModal"));
const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order_1.Order.find({ user: userId })
            .populate("items.product", "title variants")
            .sort({ createdAt: -1 });
        res.json({
            message: "Orders retrieved successfully",
            orders: orders,
        });
    }
    catch (error) {
        console.error("Error getting orders:", error);
        res
            .status(500)
            .json({ message: "Error retrieving orders", error: error.message });
    }
};
exports.getOrders = getOrders;
const getOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        res.json({
            message: "Order retrieved successfully",
            order: order,
        });
    }
    catch (error) {
        console.error("Error getting order:", error);
        res
            .status(500)
            .json({ message: "Error retrieving order", error: error.message });
    }
};
exports.getOrder = getOrder;
const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, shippingAddress, paymentMethod, totalAmount, utrNumber } = req.body;
        console.log("OrderController - Request data:", {
            userId,
            items,
            shippingAddress,
            paymentMethod,
            totalAmount,
            utrNumber,
        });
        console.log("OrderController - Items debug:", items.map((item) => ({
            productId: item.product,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
        })));
        if (!items || !shippingAddress || !paymentMethod || !totalAmount) {
            console.log("OrderController - Missing required fields:", {
                items: !!items,
                shippingAddress: !!shippingAddress,
                paymentMethod: !!paymentMethod,
                totalAmount: !!totalAmount,
            });
            return res.status(400).json({ message: "All order fields are required" });
        }
        const stockUpdates = [];
        for (const item of items) {
            const product = await ProductModal_1.default.findById(item.product);
            if (!product) {
                return res
                    .status(404)
                    .json({ message: `Product not found: ${item.product}` });
            }
            console.log("OrderController - Stock check:", {
                productId: item.product,
                productTitle: product.title,
                totalStock: product.totalStock,
                requestedQuantity: item.quantity,
            });
            if (product.totalStock < item.quantity) {
                console.log("OrderController - Insufficient stock:", {
                    productId: item.product,
                    productTitle: product.title,
                    available: product.totalStock,
                    requested: item.quantity,
                });
                return res.status(400).json({
                    message: `Insufficient stock for ${product.title}. Available: ${product.totalStock}, Requested: ${item.quantity}`,
                });
            }
            stockUpdates.push({
                productId: item.product,
                newStock: product.totalStock - item.quantity,
            });
        }
        try {
            for (const update of stockUpdates) {
                const result = await ProductModal_1.default.findByIdAndUpdate(update.productId, {
                    $set: {
                        totalStock: update.newStock,
                    },
                }, { new: true });
                if (!result) {
                    throw new Error(`Failed to update stock for product ${update.productId}`);
                }
                console.log(`OrderController - Updated stock for product ${update.productId} to ${update.newStock}`);
            }
        }
        catch (stockError) {
            console.error("OrderController - Stock update failed:", stockError);
            return res.status(500).json({
                message: "Failed to update product stock",
                error: stockError instanceof Error ? stockError.message : String(stockError),
            });
        }
        const processedItems = items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            size: item.size || undefined,
            color: item.color || undefined,
        }));
        const newOrder = new Order_1.Order({
            user: userId,
            items: processedItems,
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod,
            totalAmount: totalAmount,
            utrNumber: utrNumber,
            status: "pending",
        });
        await newOrder.save();
        const io = global.io;
        if (io) {
            io.to("admin_room").emit("new_order_notification", {
                orderId: newOrder._id,
                userId: userId,
                totalAmount: totalAmount,
                itemsCount: items.length,
                timestamp: new Date(),
                status: "pending",
            });
            console.log(`📦 New order notification sent to admin room for order ${newOrder._id}`);
        }
        res.json({
            message: "Order created successfully",
            order: newOrder,
        });
    }
    catch (error) {
        console.error("OrderController - Error creating order:", error);
        console.error("OrderController - Error stack:", error.stack);
        res
            .status(500)
            .json({ message: "Error creating order", error: error.message });
    }
};
exports.createOrder = createOrder;
const updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        order.status = status;
        await order.save();
        res.json({
            message: "Order status updated successfully",
            order: order,
        });
    }
    catch (error) {
        console.error("Error updating order status:", error);
        res
            .status(500)
            .json({ message: "Error updating order status", error: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (!["pending", "confirmed", "shipped"].includes(order.status)) {
            return res.status(400).json({
                message: `Order cannot be cancelled. Current status: ${order.status}. Only pending, confirmed, or shipped orders can be cancelled.`,
            });
        }
        order.status = "cancelled";
        await order.save();
        res.json({
            message: "Order cancelled successfully",
            order: order,
        });
    }
    catch (error) {
        console.error("Error cancelling order:", error);
        res
            .status(500)
            .json({ message: "Error cancelling order", error: error.message });
    }
};
exports.cancelOrder = cancelOrder;
const returnReplaceOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (order.status !== "delivered") {
            return res
                .status(400)
                .json({ message: "Order cannot be returned/replaced" });
        }
        order.status = "return/replace processing";
        await order.save();
        res.json({
            message: "Return/Replace request submitted successfully",
            order: order,
        });
    }
    catch (error) {
        console.error("Error processing return/replace:", error);
        res.status(500).json({
            message: "Error processing return/replace",
            error: error.message,
        });
    }
};
exports.returnReplaceOrder = returnReplaceOrder;
