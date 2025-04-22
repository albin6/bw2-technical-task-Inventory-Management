import { Request, Response } from "express";
import { InventoryItem } from "../model/inventory.model";
import { Sale } from "../model/sale.model";
import { AppError } from "../utils/app-error";
import { StatusCode } from "../constants/status-codes";
import { Messages } from "../constants/messages";

export const createSale = async (req: Request, res: Response) => {
  const { items, customerId } = req.body;

  const populatedItems = await Promise.all(
    items.map(async (i: { itemId: string; quantity: number }) => {
      const inventoryItem = await InventoryItem.findById(i.itemId);
      if (!inventoryItem)
        throw new AppError(`Item ${i.itemId} not found.`, StatusCode.NOT_FOUND);

      if (inventoryItem.quantity < i.quantity) {
        throw new AppError(
          `Insufficient stock for ${inventoryItem.name}`,
          StatusCode.CONFLICT
        );
      }

      inventoryItem.quantity -= i.quantity;
      await inventoryItem.save();

      return {
        item: inventoryItem._id,
        quantity: i.quantity,
        priceAtSale: inventoryItem.price,
      };
    })
  );

  const totalAmount = populatedItems.reduce(
    (sum, item) => sum + item.quantity * item.priceAtSale,
    0
  );

  const sale = new Sale({
    items: populatedItems,
    customer: customerId || undefined,
    isCashSale: !customerId,
    totalAmount,
  });

  await sale.save();
  res.status(StatusCode.CREATED).json({ success: true, sale });
};

export const listSales = async (req: Request, res: Response) => {
  const sales = await Sale.find()
    .populate("items.item", "name")
    .populate("customer", "name")
    .sort({ date: -1 });

  const result = sales.map((sale) => ({
    date: sale.date,
    items: sale.items.map((i) => ({
      name: (i.item as any).name,
      quantity: i.quantity,
    })),
    customer: sale.isCashSale ? "Cash" : (sale.customer as any).name,
    totalAmount: sale.totalAmount,
  }));

  res.json({ success: true, result });
};

export const singleSale = async (req: Request, res: Response) => {
  const sale = await Sale.findById(req.params.id)
    .populate("items.item", "name")
    .populate("customer");

  if (!sale) {
    throw new AppError(Messages.sale.NOT_FOUND, StatusCode.NOT_FOUND);
  }

  res.json({ success: true, sale });
};
