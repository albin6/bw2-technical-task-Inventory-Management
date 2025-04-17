// controllers/inventory.controller.ts
import { Request, Response } from "express";
import Inventory from "../models/inventory.model";
import { CustomRequest } from "../types/auth.type";
import { StatusCode } from "../constants/status-codes";
import { AppError } from "../utils/app-error";
import { Messages } from "../constants/messages";

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
export const getInventoryItems = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const items = await Inventory.find()
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .sort({ createdAt: -1 });

  const count = await Inventory.countDocuments();

  res.status(StatusCode.OK).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    data: items,
  });
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
export const getInventoryItem = async (req: Request, res: Response) => {
  const item = await Inventory.findById(req.params.id);

  if (!item) {
    throw new AppError(Messages.common.ITEM_NOT_FOUND, StatusCode.NOT_FOUND);
  }

  res.status(StatusCode.OK).json({
    success: true,
    data: item,
  });
};

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private
export const createInventoryItem = async (req: Request, res: Response) => {
  const { name, description, quantity, price, category } = req.body;

  const item = await Inventory.create({
    name,
    description,
    quantity,
    price,
    category,
    createdBy: (req as CustomRequest).user.id,
  });

  res.status(StatusCode.CREATED).json({
    success: true,
    data: item,
  });
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
export const updateInventoryItem = async (req: Request, res: Response) => {
  const { name, description, quantity, price, category } = req.body;

  let item = await Inventory.findById(req.params.id);

  if (!item) {
    return res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.common.ITEM_NOT_FOUND,
    });
  }

  item = await Inventory.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      quantity,
      price,
      category,
    },
    { new: true, runValidators: true }
  );

  res.status(StatusCode.OK).json({
    success: true,
    data: item,
  });
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
export const deleteInventoryItem = async (req: Request, res: Response) => {
  const item = await Inventory.findById(req.params.id);

  if (!item) {
    return res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.common.ITEM_NOT_FOUND,
    });
  }

  await item.deleteOne();

  res.status(StatusCode.OK).json({
    success: true,
    data: {},
  });
};

// @desc    Search inventory items
// @route   GET /api/inventory/search
// @access  Private
export const searchInventoryItems = async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.common.REQUIRED_DATA,
    });
  }

  const items = await Inventory.find({
    $text: { $search: query as string },
  });

  res.status(StatusCode.OK).json({
    success: true,
    count: items.length,
    data: items,
  });
};
