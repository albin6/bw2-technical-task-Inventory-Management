// src/controllers/reportController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { InventoryItem } from "../model/inventory.model";
import { Customer } from "../model/customer.model";
import { Sale } from "../model/sale.model";
import {
  ISalesReportQuery,
  ISalesReportResponse,
  IItemReportResponse,
  ICustomerLedgerResponse,
} from "../interface/report.interface";
import { PipelineStage } from "mongoose";

// Constants
const LOW_STOCK_THRESHOLD = 10;

/**
 * Generate Sales Report
 * GET /api/reports/sales
 * Query Parameters (optional): startDate, endDate, customerId, itemId
 */
export const getSalesReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { startDate, endDate, customerId, itemId } =
    req.query as unknown as ISalesReportQuery;

  // Build match stage for aggregation
  const matchStage: any = {};

  // Add date range filter if provided
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  // Add customer filter if provided
  if (customerId) {
    matchStage.customer = new mongoose.Types.ObjectId(customerId);
  }

  // Item filter requires a different approach since items are in an array
  if (itemId) {
    matchStage["items.item"] = new mongoose.Types.ObjectId(itemId);
  }

  // Create aggregation pipeline
  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    // Lookup to populate customer data
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerData",
      },
    },
    { $unwind: { path: "$customerData", preserveNullAndEmptyArrays: true } },
    // Unwind items array to work with individual items
    { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
    // Lookup to populate item details
    {
      $lookup: {
        from: "inventoryitems",
        localField: "items.item",
        foreignField: "_id",
        as: "items.itemData",
      },
    },
    {
      $unwind: { path: "$items.itemData", preserveNullAndEmptyArrays: true },
    },
    // Group back to reconstruct the sales with populated data
    {
      $group: {
        _id: "$_id",
        date: { $first: "$date" },
        customer: {
          $first: {
            _id: "$customerData._id",
            name: "$customerData.name",
          },
        },
        isCashSale: { $first: "$isCashSale" },
        totalAmount: { $first: "$totalAmount" },
        items: {
          $push: {
            item: {
              _id: "$items.item",
              name: "$items.itemData.name",
            },
            quantity: "$items.quantity",
            priceAtSale: "$items.priceAtSale",
          },
        },
      },
    },
    // Sort by date descending
    { $sort: { date: -1 } },
  ];

  // Execute aggregation
  const sales = await Sale.aggregate(pipeline);

  // Calculate summary using reduce
  const summary = sales.reduce(
    (acc, sale) => {
      acc.totalSalesValue += sale.totalAmount;
      sale.items.forEach((item: { item: any; quantity: any }) => {
        if (item.item && item.quantity) {
          // Check if item exists
          acc.totalUnitsSold += item.quantity;
        }
      });
      return acc;
    },
    { totalSalesValue: 0, totalUnitsSold: 0 }
  );

  const response: ISalesReportResponse = {
    summary,
    sales,
  };

  res.status(200).json(response);
};

/**
 * Generate Item Report
 * GET /api/reports/items
 */
export const getItemsReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const items = await InventoryItem.find().lean();

  // Using aggregation to get sales data for each item
  const itemSalesData = await Sale.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.item",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.priceAtSale"] },
        },
        lastSold: { $max: "$date" },
      },
    },
  ]);

  // Create a map of item sales data for quick lookup
  const itemSalesMap = itemSalesData.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  // Combine inventory data with sales data
  const formattedItems = items.map((item) => {
    const itemId = (item._id as mongoose.Types.ObjectId).toString(); // casting here
    const salesData = itemSalesMap[itemId] || { totalSold: 0, totalRevenue: 0 };

    return {
      ...item,
      _id: item._id as mongoose.Types.ObjectId, // cast here too
      isLowStock: item.quantity < LOW_STOCK_THRESHOLD,
      salesData: {
        totalSold: salesData.totalSold || 0,
        totalRevenue: salesData.totalRevenue || 0,
        lastSold: salesData.lastSold || null,
      },
    };
  });

  const response: IItemReportResponse = {
    items: formattedItems,
  };

  res.status(200).json(response);
};

/**
 * Generate Customer Ledger
 * GET /api/reports/customers/:customerId/ledger
 */
export const getCustomerLedger = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { customerId } = req.params;

  // Validate that customer exists
  const customer = await Customer.findById(customerId).lean();
  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }

  // Use aggregation pipeline for better performance and flexibility
  const pipeline: PipelineStage[] = [
    { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
    // Unwind items array to work with individual items
    { $unwind: { path: "$items" } },
    // Lookup to populate item details
    {
      $lookup: {
        from: "inventoryitems",
        localField: "items.item",
        foreignField: "_id",
        as: "items.itemData",
      },
    },
    { $unwind: { path: "$items.itemData" } },
    // Group back to reconstruct the sales with populated data
    {
      $group: {
        _id: "$_id",
        date: { $first: "$date" },
        totalAmount: { $first: "$totalAmount" },
        items: {
          $push: {
            item: {
              _id: "$items.item",
              name: "$items.itemData.name",
            },
            quantity: "$items.quantity",
            priceAtSale: "$items.priceAtSale",
          },
        },
      },
    },
    // Sort by date descending
    { $sort: { date: -1 } },
  ];

  const sales = await Sale.aggregate(pipeline);

  // Calculate summary data
  const summary = {
    totalSales: sales.length,
    totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    firstPurchaseDate: sales.length > 0 ? sales[sales.length - 1].date : null,
    lastPurchaseDate: sales.length > 0 ? sales[0].date : null,
  };

  const response = {
    customer,
    summary,
    sales,
  };

  res.status(200).json(response);
};
