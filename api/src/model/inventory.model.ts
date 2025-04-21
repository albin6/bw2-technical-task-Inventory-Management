import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInventoryItem extends Document {
  name: string;
  description: string;
  quantity: number;
  price: number;
}

const InventoryItemSchema: Schema<IInventoryItem> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const InventoryItem: Model<IInventoryItem> =
  mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);
