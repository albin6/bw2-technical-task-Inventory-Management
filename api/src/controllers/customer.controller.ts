import { Request, Response } from "express";
import Customer from "../models/customer.model";
import mongoose from "mongoose";
import { CustomRequest } from "../types/auth.type";
import { StatusCode } from "../constants/status-codes";
import { Messages } from "../constants/messages";

// Create a new customer
export const createCustomer = async (req: Request, res: Response) => {
  const { name, address, mobile, email } = req.body;

  // Validate required fields
  if (!name || !address || !mobile) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.customer.LACK_OF_DATA,
    });
    return;
  }

  // Create new customer
  const customer = new Customer({
    name,
    address,
    mobile,
    email,
    createdBy: (req as CustomRequest).user.id,
  });

  await customer.save();

  res.status(StatusCode.CREATED).json({
    success: true,
    message: Messages.customer.CREATED_SUCCESS,
    data: customer,
  });
};

// Get all customers with pagination
export const getAllCustomers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const searchTerm = req.query.search as string;

  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  if (searchTerm) {
    query = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { mobile: { $regex: searchTerm, $options: "i" } },
      ],
    };
  }

  // Count total documents for pagination
  const total = await Customer.countDocuments(query);

  // Get customers
  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(StatusCode.OK).json({
    success: true,
    data: customers,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

// Get customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.customer.INVALID_CUS_ID,
    });
    return;
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.customer.CUSTOMER_NOT_FOUND,
    });
    return;
  }

  res.status(StatusCode.OK).json({
    success: true,
    data: customer,
  });
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, mobile, email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.customer.INVALID_CUS_ID,
    });
    return;
  }

  // Validate required fields
  if (!name || !address || !mobile) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.customer.LACK_OF_DATA,
    });
    return;
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.customer.CUSTOMER_NOT_FOUND,
    });
    return;
  }

  // Update customer
  const updatedCustomer = await Customer.findByIdAndUpdate(
    id,
    {
      name,
      address,
      mobile,
      email,
    },
    { new: true }
  );

  res.status(StatusCode.OK).json({
    success: true,
    message: Messages.customer.UPDATED_SUCCESS,
    data: updatedCustomer,
  });
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.customer.INVALID_CUS_ID,
    });
    return;
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.customer.CUSTOMER_NOT_FOUND,
    });
    return;
  }

  await Customer.findByIdAndDelete(id);

  res.status(StatusCode.OK).json({
    success: true,
    message: Messages.customer.DELETED_SUCCESS,
  });
};

// Get customer ledger
export const getCustomerLedger = async (req: Request, res: Response) => {
  const { id } = req.params;
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : undefined;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.customer.INVALID_CUS_ID,
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.customer.CUSTOMER_NOT_FOUND,
    });
  }

  // Build date filter
  const dateFilter: any = { customer: new mongoose.Types.ObjectId(id) };
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = startDate;
    if (endDate) dateFilter.date.$lte = endDate;
  }

  // Get sales for customer
  const Sales = mongoose.model("Sale");
  const transactions = await Sales.find(dateFilter)
    .sort({ date: 1 })
    .populate("items.item", "name");

  return res.status(StatusCode.OK).json({
    success: true,
    data: {
      customer,
      transactions,
    },
  });
};
