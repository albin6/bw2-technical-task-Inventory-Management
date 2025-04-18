import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItem,
  getInventoryItems,
  searchInventoryItems,
  updateInventoryItem,
} from "../controllers/inventory.controller";

const router = Router();

// All routes protected
router.use(verifyAuth);

router.route("/").get(getInventoryItems).post(createInventoryItem);

router.get("/search", searchInventoryItems);

router
  .route("/:id")
  .get(getInventoryItem)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

export default router;
