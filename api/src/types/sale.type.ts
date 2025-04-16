import mongoose from "mongoose";

export interface ISaleItem {
  item: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  date: Date;
  customer: string | null;
  items: ISaleItem[];
  totalAmount: number;
  paymentMethod: "cash" | "credit";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
