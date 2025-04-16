import mongoose, { Document, Schema } from "mongoose";
import { ISaleItem } from "../types/sale.type";

export interface ISale extends Document {
  date: Date;
  customer?: mongoose.Types.ObjectId;
  customerName?: string;
  items: ISaleItem[];
  totalAmount: number;
  paymentMethod: "cash" | "credit";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
    },
    items: [
      {
        item: {
          type: Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit"],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISale>("Sale", SaleSchema);
