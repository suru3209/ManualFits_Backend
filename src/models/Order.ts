import { Schema, model, Document, Types } from "mongoose";

interface OrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface ShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalAmount: number;
  utrNumber?: string;
  status:
    | "pending"
    | "Confirmed"
    | "delivered"
    | "cancelled"
    | "shipped"
    | "returned"
    | "replaced"
    | "refunded"
    | "return/replace processing";
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<OrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  size: { type: String },
  color: { type: String },
});

const ShippingAddressSchema = new Schema<ShippingAddress>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", OrderSchema);
