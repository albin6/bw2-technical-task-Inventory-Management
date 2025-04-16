import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  address: string;
  mobile: string;
  email?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
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
CustomerSchema.index({ name: "text", mobile: "text" });

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
