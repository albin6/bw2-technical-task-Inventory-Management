import { Router } from "express";
import {
  createSale,
  listSales,
  singleSale,
} from "../controllers/sale.controller";

const router = Router();

router.route("/").post(createSale).get(listSales);
router.get("/:id", singleSale);

export default router;
