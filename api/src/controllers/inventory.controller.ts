import { Request, Response } from "express";
import { InventoryItem } from "../model/inventory.model";
import { AppError } from "../utils/app-error";
import { Messages } from "../constants/messages";
import { StatusCode } from "../constants/status-codes";

export const createInventoryItem = async (req: Request, res: Response) => {
  const { name, description, quantity, price } = req.body;

  const item = await InventoryItem.findOne({
    name: { $regex: name, $options: "i" },
  });

  if (item) {
    throw new AppError(Messages.item.ITEM_EXISTS, StatusCode.CONFLICT);
  }

  const newItem = new InventoryItem({
    name,
    description,
    quantity,
    price,
  });

  await newItem.save();

  res
    .status(StatusCode.CREATED)
    .json({ success: true, message: Messages.item.ITEM_CREATED });
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, quantity, price } = req.body;

  // Check if the item exists
  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new AppError(Messages.item.ITEM_NOT_FOUND, StatusCode.NOT_FOUND);
  }

  // If name is being updated, check if the new name already exists (but isn't this item)
  if (name && name !== item.name) {
    const existingItem = await InventoryItem.findOne({
      name: { $regex: name, $options: "i" },
      _id: { $ne: id }, // exclude current item from check
    });

    if (existingItem) {
      throw new AppError(Messages.item.ITEM_EXISTS, StatusCode.CONFLICT);
    }
  }

  // Update the item
  const updatedItem = await InventoryItem.findByIdAndUpdate(
    id,
    { name, description, quantity, price },
    { new: true, runValidators: true }
  );

  res.status(StatusCode.OK).json({
    success: true,
    message: Messages.item.ITEM_UPDATED,
    data: updatedItem,
  });
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if the item exists
  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new AppError(Messages.item.ITEM_NOT_FOUND, StatusCode.NOT_FOUND);
  }

  // Delete the item
  await InventoryItem.findByIdAndDelete(id);

  res.status(StatusCode.OK).json({
    success: true,
    message: Messages.item.ITEM_DELETED,
  });
};

export const getInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new AppError(Messages.item.ITEM_NOT_FOUND, StatusCode.NOT_FOUND);
  }

  res.status(StatusCode.OK).json({
    success: true,
    data: item,
  });
};

export const getAllInventoryItems = async (req: Request, res: Response) => {
  // Extract query parameters
  const { page = 1, limit = 10, search = "" } = req.query;

  // Convert to appropriate types
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build search query
  const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search as string, $options: "i" } },
          { description: { $regex: search as string, $options: "i" } },
        ],
      }
    : {};

  // Count total matching documents for pagination info
  const totalItems = await InventoryItem.countDocuments(searchQuery);

  // Get paginated results
  const items = await InventoryItem.find(searchQuery)
    .skip(skip)
    .limit(limitNum);

  res.status(StatusCode.OK).json({
    success: true,
    count: items.length,
    totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
    data: items,
  });
};
