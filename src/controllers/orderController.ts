import { Request, Response } from "express";
import User from "../models/User";
import { Order } from "../models/Order";
import Product from "../models/ProductModal";

// Get user's orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Fetch orders from Order collection
    const orders = await Order.find({ user: userId })
      .populate("items.product", "title variants")
      .sort({ createdAt: -1 });

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
    const userId = (req as any).user.id;
    const { items, shippingAddress, paymentMethod, totalAmount, utrNumber } =
      req.body;

    console.log("OrderController - Request data:", {
      userId,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      utrNumber,
    });

    // Debug items data
    console.log(
      "OrderController - Items debug:",
      items.map((item: any) => ({
        productId: item.product,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      }))
    );

    if (!items || !shippingAddress || !paymentMethod || !totalAmount) {
      console.log("OrderController - Missing required fields:", {
        items: !!items,
        shippingAddress: !!shippingAddress,
        paymentMethod: !!paymentMethod,
        totalAmount: !!totalAmount,
      });
      return res.status(400).json({ message: "All order fields are required" });
    }

    // Validate stock availability and update stock
    const stockUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      // Check if there's enough total stock for this product
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

      // Prepare stock update
      stockUpdates.push({
        productId: item.product,
        newStock: product.totalStock - item.quantity,
      });
    }

    // Update stock quantities
    try {
      for (const update of stockUpdates) {
        const result = await Product.findByIdAndUpdate(
          update.productId,
          {
            $set: {
              totalStock: update.newStock,
            },
          },
          { new: true }
        );
        if (!result) {
          throw new Error(
            `Failed to update stock for product ${update.productId}`
          );
        }
        console.log(
          `OrderController - Updated stock for product ${update.productId} to ${update.newStock}`
        );
      }
    } catch (stockError) {
      console.error("OrderController - Stock update failed:", stockError);
      return res.status(500).json({
        message: "Failed to update product stock",
        error:
          stockError instanceof Error ? stockError.message : String(stockError),
      });
    }

    // Process items to include size and color
    const processedItems = items.map((item: any) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      size: item.size || undefined,
      color: item.color || undefined,
    }));

    // Create new order
    const newOrder = new Order({
      user: userId,
      items: processedItems,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
      utrNumber: utrNumber,
      status: "pending",
    });

    await newOrder.save();

    // Emit notification to admin room for new order
    const io = (global as any).io;
    if (io) {
      io.to("admin_room").emit("new_order_notification", {
        orderId: newOrder._id,
        userId: userId,
        totalAmount: totalAmount,
        itemsCount: items.length,
        timestamp: new Date(),
        status: "pending",
      });
      console.log(
        `📦 New order notification sent to admin room for order ${newOrder._id}`
      );
    }

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

    // Only allow cancellation if order is pending, confirmed, or shipped
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
    res.status(500).json({
      message: "Error processing return/replace",
      error: error.message,
    });
  }
};
