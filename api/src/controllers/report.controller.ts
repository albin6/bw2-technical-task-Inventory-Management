// controllers/report.controller.ts
import { Request, Response } from "express";
import Sale from "../models/sale.model";
import Inventory from "../models/inventory.model";
import Customer from "../models/customer.model";
import { generatePdf } from "../utils/pdf-generator";
import { generateExcel } from "../utils/excel-generator";
import { sendEmail } from "../utils/email-sender";
import { StatusCode } from "../constants/status-codes";
import { Messages } from "../constants/messages";

// Helper function to get date range
const getDateRange = (req: Request) => {
  const { startDate, endDate } = req.query;

  let dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter = {
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    };
  }

  return dateFilter;
};

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req: Request, res: Response) => {
  const dateFilter = getDateRange(req);

  // Get sales
  const sales = await Sale.find(dateFilter)
    .populate("customer", "name")
    .sort({ date: -1 });

  // Calculate total revenue
  const totalRevenue = sales.reduce(
    (total, sale) => total + sale.totalAmount,
    0
  );

  // Group by date
  const salesByDate = sales.reduce((acc: any, sale) => {
    const date = new Date(sale.date).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        count: 0,
        total: 0,
      };
    }
    acc[date].count++;
    acc[date].total += sale.totalAmount;
    return acc;
  }, {});

  res.status(StatusCode.OK).json({
    success: true,
    data: {
      totalRevenue,
      totalSales: sales.length,
      sales,
      salesByDate: Object.values(salesByDate),
    },
  });
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
export const getInventoryReport = async (req: Request, res: Response) => {
  // Get all inventory items
  const items = await Inventory.find().sort({ name: 1 });

  // Calculate total inventory value
  const totalValue = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Find low stock items (less than 10)
  const lowStockItems = items.filter((item) => item.quantity < 10);

  res.status(StatusCode.OK).json({
    success: true,
    data: {
      totalItems: items.length,
      totalValue,
      items,
      lowStockItems,
    },
  });
};

// @desc    Get customer ledger
// @route   GET /api/reports/customer/:id
// @access  Private
export const getCustomerLedger = async (req: Request, res: Response) => {
  const customerId = req.params.id;
  const dateFilter = getDateRange(req);

  // Find customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.auth.USER_NOT_FOUND,
    });
  }

  // Find all sales for this customer
  const query = {
    customer: customerId,
    ...dateFilter,
  };

  const sales = await Sale.find(query).sort({ date: 1 });

  // Calculate total purchases
  const totalPurchases = sales.reduce(
    (total, sale) => total + sale.totalAmount,
    0
  );

  res.status(StatusCode.OK).json({
    success: true,
    data: {
      customer,
      totalPurchases,
      totalTransactions: sales.length,
      transactions: sales,
    },
  });
};

// @desc    Export sales report as PDF
// @route   GET /api/reports/sales/pdf
// @access  Private
export const exportSalesReportPdf = async (req: Request, res: Response) => {
  const dateFilter = getDateRange(req);

  // Get sales
  const sales = await Sale.find(dateFilter)
    .populate("customer", "name")
    .sort({ date: -1 });

  // Generate PDF
  const pdfBuffer = await generatePdf("sales-report", {
    title: "Sales Report",
    dateRange: {
      start: req.query.startDate || "All time",
      end: req.query.endDate || "Current",
    },
    totalSales: sales.length,
    totalRevenue: sales.reduce((total, sale) => total + sale.totalAmount, 0),
    sales: sales.map((sale) => ({
      id: sale._id,
      date: new Date(sale.date).toLocaleDateString(),
      customer: sale.customerName || "Cash Sale",
      items: sale.items.length,
      total: sale.totalAmount,
    })),
  });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");

  // Send PDF
  res.send(pdfBuffer);
};

// @desc    Export sales report as Excel
// @route   GET /api/reports/sales/excel
// @access  Private
export const exportSalesReportExcel = async (req: Request, res: Response) => {
  const dateFilter = getDateRange(req);

  // Get sales
  const sales = await Sale.find(dateFilter)
    .populate("customer", "name")
    .sort({ date: -1 });

  // Generate Excel
  const excelBuffer = await generateExcel("sales-report", {
    title: "Sales Report",
    dateRange: {
      start: req.query.startDate || "All time",
      end: req.query.endDate || "Current",
    },
    sales: sales.map((sale) => ({
      id: (sale._id as any).toString(),
      date: new Date(sale.date).toLocaleDateString(),
      customer: sale.customerName || "Cash Sale",
      items: sale.items.length,
      total: sale.totalAmount,
    })),
  });

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales-report.xlsx"
  );

  // Send Excel
  res.send(excelBuffer);
};

// @desc    Export sales report via email
// @route   POST /api/reports/sales/email
// @access  Private
export const exportSalesReportEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const dateFilter = getDateRange(req);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email address is required",
    });
  }

  // Get sales
  const sales = await Sale.find(dateFilter)
    .populate("customer", "name")
    .sort({ date: -1 });

  // Generate PDF
  const pdfBuffer = await generatePdf("sales-report", {
    title: "Sales Report",
    dateRange: {
      start: req.query.startDate || "All time",
      end: req.query.endDate || "Current",
    },
    totalSales: sales.length,
    totalRevenue: sales.reduce((total, sale) => total + sale.totalAmount, 0),
    sales: sales.map((sale) => ({
      id: sale._id,
      date: new Date(sale.date).toLocaleDateString(),
      customer: sale.customerName || "Cash Sale",
      items: sale.items.length,
      total: sale.totalAmount,
    })),
  });

  // Send email
  await sendEmail({
    to: email,
    subject: "Sales Report",
    text: "Please find attached the sales report you requested.",
    attachments: [
      {
        filename: "sales-report.pdf",
        content: pdfBuffer,
      },
    ],
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: `Sales report sent to ${email}`,
  });
};

// @desc    Export inventory report as PDF
// @route   GET /api/reports/inventory/pdf
// @access  Private
export const exportInventoryReportPdf = async (req: Request, res: Response) => {
  // Get all inventory items
  const items = await Inventory.find().sort({ name: 1 });

  // Generate PDF
  const pdfBuffer = await generatePdf("inventory-report", {
    title: "Inventory Report",
    date: new Date().toLocaleDateString(),
    totalItems: items.length,
    totalValue: items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
    items: items.map((item) => ({
      id: item._id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      value: item.price * item.quantity,
    })),
  });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=inventory-report.pdf"
  );

  // Send PDF
  res.send(pdfBuffer);
};

// @desc    Export inventory report as Excel
// @route   GET /api/reports/inventory/excel
// @access  Private
export const exportInventoryReportExcel = async (
  req: Request,
  res: Response
) => {
  // Get all inventory items
  const items = await Inventory.find().sort({ name: 1 });

  // Generate Excel
  const excelBuffer = await generateExcel("inventory-report", {
    title: "Inventory Report",
    date: new Date().toLocaleDateString(),
    items: items.map((item) => ({
      id: (item._id as any).toString(),
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      value: item.price * item.quantity,
    })),
  });

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=inventory-report.xlsx"
  );

  // Send Excel
  res.send(excelBuffer);
};

// @desc    Export inventory report via email
// @route   POST /api/reports/inventory/email
// @access  Private
export const exportInventoryReportEmail = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  if (!email) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.auth.EMAIL_REQUIRED,
    });
  }

  // Get all inventory items
  const items = await Inventory.find().sort({ name: 1 });

  // Generate PDF
  const pdfBuffer = await generatePdf("inventory-report", {
    title: "Inventory Report",
    date: new Date().toLocaleDateString(),
    totalItems: items.length,
    totalValue: items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
    items: items.map((item) => ({
      id: item._id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      value: item.price * item.quantity,
    })),
  });

  // Send email
  await sendEmail({
    to: email,
    subject: "Inventory Report",
    text: "Please find attached the inventory report you requested.",
    attachments: [
      {
        filename: "inventory-report.pdf",
        content: pdfBuffer,
      },
    ],
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: `Inventory report sent to ${email}`,
  });
};

// @desc    Export customer ledger as PDF
// @route   GET /api/reports/customer/:id/pdf
// @access  Private
export const exportCustomerLedgerPdf = async (req: Request, res: Response) => {
  const customerId = req.params.id;
  const dateFilter = getDateRange(req);

  // Find customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.auth.USER_NOT_FOUND,
    });
  }

  // Find all sales for this customer
  const query = {
    customer: customerId,
    ...dateFilter,
  };

  const sales = await Sale.find(query).sort({ date: 1 });

  // Generate PDF
  const pdfBuffer = await generatePdf("customer-ledger", {
    title: "Customer Ledger",
    customer: {
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      email: customer.email,
    },
    dateRange: {
      start: req.query.startDate || "All time",
      end: req.query.endDate || "Current",
    },
    totalTransactions: sales.length,
    totalAmount: sales.reduce((total, sale) => total + sale.totalAmount, 0),
    transactions: sales.map((sale) => ({
      id: sale._id,
      date: new Date(sale.date).toLocaleDateString(),
      items: sale.items
        .map((item) => `${item.quantity} x ${item.name}`)
        .join(", "),
      total: sale.totalAmount,
    })),
  });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=customer-ledger-${customer._id}.pdf`
  );

  // Send PDF
  res.send(pdfBuffer);
};

// @desc    Export customer ledger as Excel
// @route   GET /api/reports/customer/:id/excel
// @access  Private
export const exportCustomerLedgerExcel = async (
  req: Request,
  res: Response
) => {
  const customerId = req.params.id;
  const dateFilter = getDateRange(req);

  // Find customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  // Find all sales for this customer
  const query = {
    customer: customerId,
    ...dateFilter,
  };

  const sales = await Sale.find(query).sort({ date: 1 });

  // Generate Excel
  const excelBuffer = await generateExcel("customer-ledger", {
    title: "Customer Ledger",
    customer: {
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      email: customer.email,
    },
    transactions: sales.map((sale) => ({
      id: (sale._id as any).toString(),
      date: new Date(sale.date).toLocaleDateString(),
      paymentMethod: sale.paymentMethod,
      totalItems: sale.items.reduce((total, item) => total + item.quantity, 0),
      total: sale.totalAmount,
    })),
  });

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=customer-ledger-${customer._id}.xlsx`
  );

  // Send Excel
  res.send(excelBuffer);
};

// @desc    Export customer ledger via email
// @route   POST /api/reports/customer/:id/email
// @access  Private
export const exportCustomerLedgerEmail = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;
  const customerId = req.params.id;
  const dateFilter = getDateRange(req);

  if (!email) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: Messages.auth.EMAIL_REQUIRED,
    });
  }

  // Find customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: Messages.auth.USER_NOT_FOUND,
    });
  }

  // Find all sales for this customer
  const query = {
    customer: customerId,
    ...dateFilter,
  };

  const sales = await Sale.find(query).sort({ date: 1 });

  // Generate PDF
  const pdfBuffer = await generatePdf("customer-ledger", {
    title: "Customer Ledger",
    customer: {
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      email: customer.email,
    },
    dateRange: {
      start: req.query.startDate || "All time",
      end: req.query.endDate || "Current",
    },
    totalTransactions: sales.length,
    totalAmount: sales.reduce((total, sale) => total + sale.totalAmount, 0),
    transactions: sales.map((sale) => ({
      id: sale._id,
      date: new Date(sale.date).toLocaleDateString(),
      items: sale.items
        .map((item) => `${item.quantity} x ${item.name}`)
        .join(", "),
      total: sale.totalAmount,
    })),
  });

  // Send email
  await sendEmail({
    to: email,
    subject: `Customer Ledger - ${customer.name}`,
    text: `Please find attached the ledger report for customer: ${customer.name}.`,
    attachments: [
      {
        filename: `customer-ledger-${customer._id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: `Customer ledger sent to ${email}`,
  });
};
