import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  address: string;
  mobileNumber: string;
}

const CustomerSchema: Schema<ICustomer> = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: "" },
    mobileNumber: { type: String, required: true },
  },
  { timestamps: true }
);

export const Customer: Model<ICustomer> = mongoose.model<ICustomer>(
  "Customer",
  CustomerSchema
);
