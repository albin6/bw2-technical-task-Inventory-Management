import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import {
  getSalesReport,
  emailReport,
  exportToExcel,
  exportToPdf,
  getCustomerLedgerReport,
  getItemsReport,
} from "../controllers/report.controller";

const router = Router();

// All report routes should be protected (require authentication)
router.use(verifyAuth);

// Get various reports
router.get("/sales", getSalesReport);
router.get("/items", getItemsReport);
router.get("/customer-ledger/:customerId", getCustomerLedgerReport);

// Export reports to Excel
router.get("/export/excel/:reportType", exportToExcel);

// Export reports to PDF
router.get("/export/pdf/:reportType", exportToPdf);

// Email reports
router.post("/email/:reportType", emailReport);

export default router;
