import mongoose, { Document, Model, Schema } from "mongoose";

interface ISaleItem {
  item: mongoose.Types.ObjectId;
  quantity: number;
  priceAtSale: number; // capture price at the time
}

export interface ISale extends Document {
  date: Date;
  items: ISaleItem[];
  customer?: mongoose.Types.ObjectId;
  isCashSale: boolean;
  totalAmount: number;
}

const SaleItemSchema: Schema<ISaleItem> = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtSale: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema: Schema<ISale> = new Schema(
  {
    date: { type: Date, default: Date.now },
    items: { type: [SaleItemSchema], required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    isCashSale: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Sale: Model<ISale> = mongoose.model<ISale>("Sale", SaleSchema);
