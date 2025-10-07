import { Request, Response } from "express";
import User from "../models/User";
import { Order } from "../models/Order";
import Product from "../models/ProductModal";

// Get user's orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    console.log("OrderController - Getting orders for user:", userId);

    // Fetch orders from Order collection
    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 });

    console.log("OrderController - User orders:", orders);
    console.log("OrderController - Orders length:", orders.length);

    res.json({
      message: "Orders retrieved successfully",
      orders: orders,
    });
  } catch (error: any) {
    console.error("Error getting orders:", error);
    res
      .status(500)
      .json({ message: "Error retrieving orders", error: error.message });
  }
};

// Get single order
export const getOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      message: "Order retrieved successfully",
      order: order,
    });
  } catch (error: any) {
    console.error("Error getting order:", error);
    res
      .status(500)
      .json({ message: "Error retrieving order", error: error.message });
  }
};

// Create new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    console.log("OrderController - createOrder called");
    const userId = (req as any).user.id;
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

    // Create new order
    const newOrder = new Order({
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
  } catch (error: any) {
    console.error("OrderController - Error creating order:", error);
    console.error("OrderController - Error stack:", error.stack);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    order.status = status;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order: order,
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only allow cancellation if order is pending or shipped
    if (!["pending", "shipped"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully",
      order: order,
    });
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    res
      .status(500)
      .json({ message: "Error cancelling order", error: error.message });
  }
};

// Return/Replace order
export const returnReplaceOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only allow return/replace if order is delivered
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
  } catch (error: any) {
    console.error("Error processing return/replace:", error);
    res
      .status(500)
      .json({
        message: "Error processing return/replace",
        error: error.message,
      });
  }
};
