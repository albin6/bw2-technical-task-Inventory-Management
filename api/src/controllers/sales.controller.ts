// controllers/sales.controller.ts
import { Request, Response } from "express";
import Sale from "../models/sale.model";
import Inventory from "../models/inventory.model";
import Customer from "../models/customer.model";
import mongoose from "mongoose";
import { StatusCode } from "../constants/status-codes";
import { CustomRequest } from "../types/auth.type";
import { AppError } from "../utils/app-error";
import { Messages } from "../constants/messages";

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
export const getSales = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, startDate, endDate } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  // Build query
  let query: any = {};

  // Date range filtering
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string),
    };
  }

  const sales = await Sale.find(query)
    .populate("customer", "name")
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .sort({ date: -1 });

  const count = await Sale.countDocuments(query);

  res.status(StatusCode.OK).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    data: sales,
  });
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
export const getSale = async (req: Request, res: Response) => {
  const sale = await Sale.findById(req.params.id)
    .populate("customer", "name address mobile email")
    .populate("items.item", "name");

  if (!sale) {
    res.status(404).json({
      success: false,
      message: "Sale not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: sale,
  });
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
export const createSale = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { date, customer, items, paymentMethod } = req.body;

    // Calculate total amount
    let totalAmount = 0;
    const saleItems = [];

    // Process each item in the sale
    for (const item of items) {
      // Get the inventory item
      const inventoryItem = await Inventory.findById(item.item);

      if (!inventoryItem) {
        throw new AppError(
          Messages.common.ITEM_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      // Check if enough quantity is available
      if (inventoryItem.quantity < item.quantity) {
        throw new AppError(
          Messages.common.NO_ENOUGH_QTY,
          StatusCode.BAD_REQUEST
        );
      }

      // Update inventory quantity
      await Inventory.findByIdAndUpdate(
        item.item,
        { $inc: { quantity: -item.quantity } },
        { session }
      );

      // Calculate subtotal
      const subtotal = item.quantity * inventoryItem.price;
      totalAmount += subtotal;

      // Add to sale items
      saleItems.push({
        item: inventoryItem._id,
        name: inventoryItem.name,
        quantity: item.quantity,
        price: inventoryItem.price,
        subtotal,
      });
    }

    // Create sale object
    const saleData: any = {
      date: date || new Date(),
      items: saleItems,
      totalAmount,
      paymentMethod,
      createdBy: (req as CustomRequest).user?.id,
    };

    // Handle customer info
    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        saleData.customer = customer;
        saleData.customerName = customerDoc.name;
      }
    } else {
      // Cash sale without customer
      saleData.customerName = "Cash Sale";
    }

    // Create the sale
    const sale = await Sale.create([saleData], { session });

    // Commit transaction
    await session.commitTransaction();

    res.status(StatusCode.OK).json({
      success: true,
      data: sale[0],
    });
  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();

    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error",
    });
  } finally {
    // End session
    session.endSession();
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
export const updateSale = async (req: Request, res: Response) => {
  const { date, paymentMethod } = req.body;

  let sale = await Sale.findById(req.params.id);

  if (!sale) {
    res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.common.SALE_NOT_FOUND,
    });
    return;
  }

  // Only allow updating certain fields (not items or quantities to maintain inventory integrity)
  sale = await Sale.findByIdAndUpdate(
    req.params.id,
    {
      date,
      paymentMethod,
    },
    { new: true, runValidators: true }
  ).populate("customer", "name");

  res.status(StatusCode.OK).json({
    success: true,
    data: sale,
  });
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
export const deleteSale = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: Messages.common.SALE_NOT_FOUND,
      });
      return;
    }

    // Return items to inventory
    for (const item of sale.items) {
      await Inventory.findByIdAndUpdate(
        item.item,
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }

    // Delete the sale
    await sale.deleteOne({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(StatusCode.OK).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();

    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error",
    });
  } finally {
    // End session
    session.endSession();
  }
};

// @desc    Get sales by customer
// @route   GET /api/sales/customer/:id
// @access  Private
export const getSalesByCustomer = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const sales = await Sale.find({ customer: req.params.id })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .sort({ date: -1 });

  const count = await Sale.countDocuments({ customer: req.params.id });

  res.status(StatusCode.OK).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    data: sales,
  });
};
