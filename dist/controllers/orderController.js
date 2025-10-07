"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnReplaceOrder = exports.cancelOrder = exports.updateOrderStatus = exports.createOrder = exports.getOrder = exports.getOrders = void 0;
const Order_1 = require("../models/Order");
const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("OrderController - Getting orders for user:", userId);
        const orders = await Order_1.Order.find({ user: userId })
            .populate("items.product", "name price images")
            .sort({ createdAt: -1 });
        console.log("OrderController - User orders:", orders);
        console.log("OrderController - Orders length:", orders.length);
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
        console.log("OrderController - createOrder called");
        const userId = req.user.id;
        const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
        console.log("OrderController - Received data:", {
            userId,
            items,
            shippingAddress,
            paymentMethod,
            totalAmount,
        });
        if (!items || !shippingAddress || !paymentMethod || !totalAmount) {
            console.log("OrderController - Missing required fields:", {
                items: !!items,
                shippingAddress: !!shippingAddress,
                paymentMethod: !!paymentMethod,
                totalAmount: !!totalAmount,
            });
            return res.status(400).json({ message: "All order fields are required" });
        }
        const newOrder = new Order_1.Order({
            user: userId,
            items: items,
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod,
            totalAmount: totalAmount,
            status: "pending",
        });
        console.log("OrderController - Order object created:", newOrder);
        await newOrder.save();
        console.log("OrderController - Order saved successfully");
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
        if (!["pending", "shipped"].includes(order.status)) {
            return res.status(400).json({ message: "Order cannot be cancelled" });
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
        res
            .status(500)
            .json({
            message: "Error processing return/replace",
            error: error.message,
        });
    }
};
exports.returnReplaceOrder = returnReplaceOrder;
