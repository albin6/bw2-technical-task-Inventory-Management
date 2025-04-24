import { Router } from "express";
import {
  getCustomerLedger,
  getItemsReport,
  getSalesReport,
} from "../controllers/report.controller";

const router = Router();

// Sales Report
router.get("/sales", getSalesReport);

// Item Report
router.get("/items", getItemsReport);

// Customer Ledger
router.get("/customers/:customerId/ledger", getCustomerLedger);

export default router;
