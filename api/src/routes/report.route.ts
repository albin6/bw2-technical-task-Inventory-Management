import { Router } from "express";
import {
  getCustomerLedger,
  getItemsReport,
  getSalesReport,
} from "../controllers/report.controller";
import { generateSalesReport } from "../controllers/export.controller";

const router = Router();

// Sales Report
router.get("/sales", getSalesReport);

// Item Report
router.get("/items", getItemsReport);

// Customer Ledger
router.get("/customers/:customerId/ledger", getCustomerLedger);

router.get("/export", generateSalesReport);

export default router;
