import { Router } from "express";
import {
  createInventoryItem,
  deleteInventoryItem,
  getAllInventoryItems,
  updateInventoryItem,
} from "../controllers/inventory.controller";

const router = Router();

router.route("/").post(createInventoryItem).get(getAllInventoryItems);

router.route("/:id").put(updateInventoryItem).delete(deleteInventoryItem);

export default router;
