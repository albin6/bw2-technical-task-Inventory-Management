import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import {
  createSale,
  deleteSale,
  getSale,
  getSales,
  getSalesByCustomer,
  updateSale,
} from "../controllers/sales.controller";

const router = Router();

// All routes protected
router.use(verifyAuth);

router.route("/").get(getSales).post(createSale);

router.route("/:id").get(getSale).put(updateSale).delete(deleteSale);

router.get("/customer/:id", getSalesByCustomer);

export default router;
