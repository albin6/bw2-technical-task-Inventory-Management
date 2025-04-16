import mongoose, { Document, Schema } from "mongoose";

export interface IInventoryItem extends Document {
  name: string;
  description: string;
  quantity: number;
  price: number;
  category?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
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

// Create text index for search functionality
InventoryItemSchema.index({ name: "text", description: "text" });

export default mongoose.model<IInventoryItem>(
  "InventoryItem",
  InventoryItemSchema
);
