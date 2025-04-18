import { Request, Response } from "express";
import mongoose from "mongoose";
import Sale from "../models/sale.model";
import InventoryItem from "../models/inventory.model";
import Customer from "../models/customer.model";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import sendEmail from "../utils/email-sender";

// Helper function to format date range for reports
const getDateRangeFilter = (req: Request) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(new Date().setDate(new Date().getDate() - 30)); // Default to last 30 days
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : new Date();

  // Set end date to end of day
  endDate.setHours(23, 59, 59, 999);

  return {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };
};

// Sales Report
export const getSalesReport = async (req: Request, res: Response) => {
  const dateFilter = getDateRangeFilter(req);
  const groupBy = (req.query.groupBy as string) || "day"; // Options: day, week, month

  let groupingStage;
  if (groupBy === "day") {
    groupingStage = {
      $dateToString: { format: "%Y-%m-%d", date: "$date" },
    };
  } else if (groupBy === "week") {
    groupingStage = {
      $concat: [
        { $toString: { $isoWeekYear: "$date" } },
        "-W",
        { $toString: { $isoWeek: "$date" } },
      ],
    };
  } else if (groupBy === "month") {
    groupingStage = {
      $dateToString: { format: "%Y-%m", date: "$date" },
    };
  }

  const salesReport = await Sale.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: groupingStage,
        totalSales: { $sum: "$totalAmount" },
        count: { $sum: 1 },
        items: { $push: "$items" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Process sales data for better reporting
  const processedData = salesReport.map((entry) => {
    // Flatten items array
    const allItems = entry.items.flat();

    // Count unique products
    const uniqueProducts = new Set(
      allItems.map((item: any) => item.item.toString())
    ).size;

    return {
      period: entry._id,
      totalSales: entry.totalSales,
      count: entry.count,
      uniqueProducts,
    };
  });

  res.status(200).json({
    success: true,
    data: processedData,
    meta: {
      startDate: dateFilter.date.$gte,
      endDate: dateFilter.date.$lte,
      groupBy,
    },
  });
};

// Items Report
export const getItemsReport = async (req: Request, res: Response) => {
  const dateFilter = getDateRangeFilter(req);

  // Get top selling items
  const topSellingItems = await Sale.aggregate([
    { $match: dateFilter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.item",
        name: { $first: "$items.name" },
        totalQuantity: { $sum: "$items.quantity" },
        totalSales: { $sum: "$items.subtotal" },
        averagePrice: { $avg: "$items.price" },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 20 },
  ]);

  // Get current inventory levels
  const inventoryLevels = await InventoryItem.find({}, "name quantity price");

  // Get inventory items with low quantity (potential restock needed)
  const lowStockItems = await InventoryItem.find(
    { quantity: { $lt: 10 } },
    "name quantity price"
  );

  res.status(200).json({
    success: true,
    data: {
      topSellingItems,
      inventoryLevels,
      lowStockItems,
    },
    meta: {
      startDate: dateFilter.date.$gte,
      endDate: dateFilter.date.$lte,
    },
  });
};

// Customer Ledger Report
export const getCustomerLedgerReport = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const dateFilter: any = getDateRangeFilter(req);

  // Add customer filter
  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    dateFilter.customer = new mongoose.Types.ObjectId(customerId);
  }

  // Get customer details
  const customer = customerId ? await Customer.findById(customerId) : null;

  if (customerId && !customer) {
    res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  // Get all transactions for the customer
  const transactions = await Sale.find({
    ...dateFilter,
    customer: new mongoose.Types.ObjectId(customerId),
  })
    .sort({ date: 1 })
    .populate("items.item", "name");

  // Calculate summary metrics
  const totalSales = transactions.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const itemsPurchased = transactions.reduce((sum, sale) => {
    return (
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    );
  }, 0);

  res.status(200).json({
    success: true,
    data: {
      customer,
      transactions,
      summary: {
        totalSales,
        transactionCount: transactions.length,
        itemsPurchased,
      },
    },
    meta: {
      startDate: dateFilter.date.$gte,
      endDate: dateFilter.date.$lte,
    },
  });
};

// Export report to Excel
export const exportToExcel = async (req: Request, res: Response) => {
  const { reportType } = req.params;
  const dateFilter = getDateRangeFilter(req);
  const customerId = req.query.customerId as string;

  // Create a new Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  // Configure report based on type
  let reportData: any[] = [];
  let fileName = "";

  if (reportType === "sales") {
    // Sales report export
    fileName = `sales_report_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Get sales data
    const sales = await Sale.find(dateFilter)
      .sort({ date: 1 })
      .populate("customer", "name")
      .populate("createdBy", "username");

    // Set up columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Payment Method", key: "paymentMethod", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Created By", key: "createdBy", width: 15 },
    ];

    // Add rows
    sales.forEach((sale) => {
      worksheet.addRow({
        date: sale.date.toLocaleDateString(),
        customer: sale.customer
          ? (sale.customer as any).name
          : sale.customerName || "Cash Sale",
        paymentMethod: sale.paymentMethod,
        totalAmount: sale.totalAmount,
        createdBy: sale.createdBy
          ? (sale.createdBy as any).username
          : "Unknown",
      });
    });

    // Add summary row
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    worksheet.addRow({});
    worksheet.addRow({
      customer: "TOTAL",
      totalAmount,
    });
  } else if (reportType === "items") {
    // Items report export
    fileName = `inventory_report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Get inventory data
    const items = await InventoryItem.find().sort({ name: 1 });

    // Set up columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Description", key: "description", width: 30 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 15 },
      { header: "Category", key: "category", width: 15 },
      { header: "Value", key: "value", width: 15 },
    ];

    // Add rows
    let totalValue = 0;
    items.forEach((item) => {
      const value = item.quantity * item.price;
      totalValue += value;

      worksheet.addRow({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        category: item.category || "Uncategorized",
        value,
      });
    });

    // Add summary row
    worksheet.addRow({});
    worksheet.addRow({
      name: "TOTAL",
      value: totalValue,
    });
  } else if (reportType === "customer-ledger" && customerId) {
    // Customer ledger export
    const customer = await Customer.findById(customerId);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    fileName = `customer_ledger_${customer.name.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Get all transactions for customer
    const transactions = await Sale.find({
      ...dateFilter,
      customer: new mongoose.Types.ObjectId(customerId),
    }).sort({ date: 1 });

    // Set up columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Items", key: "items", width: 30 },
      { header: "Payment Method", key: "paymentMethod", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    // Add customer info
    worksheet.addRow(["Customer Name", customer.name]);
    worksheet.addRow(["Address", customer.address]);
    worksheet.addRow(["Mobile", customer.mobile]);
    if (customer.email) worksheet.addRow(["Email", customer.email]);
    worksheet.addRow([]);

    // Add transaction rows
    let totalAmount = 0;
    transactions.forEach((transaction) => {
      const itemsStr = transaction.items
        .map((item) => `${item.name} (${item.quantity})`)
        .join(", ");
      totalAmount += transaction.totalAmount;

      worksheet.addRow({
        date: transaction.date.toLocaleDateString(),
        items: itemsStr,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.totalAmount,
      });
    });

    // Add summary row
    worksheet.addRow({});
    worksheet.addRow({
      items: "TOTAL",
      amount: totalAmount,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid report type or missing customer ID for ledger",
    });
    return;
  }

  // Create directory if it doesn't exist
  const dir = path.join(__dirname, "../exports");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, fileName);

  // Write to file
  await workbook.xlsx.writeFile(filePath);

  // Send file for download
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      return res.status(500).json({
        success: false,
        message: "Error downloading file",
        error: err.message,
      });
    }

    // Delete file after download
    fs.unlinkSync(filePath);
  });
};

export const exportToPdf = async (req: Request, res: Response) => {
  const { reportType } = req.params;
  const dateFilter = getDateRangeFilter(req);
  const customerId = req.query.customerId as string;

  // Create directory if it doesn't exist
  const dir = path.join(__dirname, "../exports");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let fileName = "";
  let filePath = ""; // Declare filePath here at the top level
  let stream: fs.WriteStream; // Declare stream here at the top level
  const doc = new PDFDocument({ margin: 50 });

  if (reportType === "sales") {
    // Sales report PDF
    fileName = `sales_report_${new Date().toISOString().split("T")[0]}.pdf`;
    filePath = path.join(dir, fileName);

    // Pipe to file and response
    stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Get sales data
    const sales = await Sale.find(dateFilter)
      .sort({ date: 1 })
      .populate("customer", "name")
      .populate("createdBy", "username");

    // Add report title
    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Period: ${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}`,
        { align: "center" }
      );
    doc.moveDown(2);

    // Create table
    const tableTop = 150;
    let i = 0;
    let tableRow = 0;

    // Table headers
    doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
    doc.text("Customer", 150, tableTop + tableRow * 20);
    doc.text("Payment", 300, tableTop + tableRow * 20);
    doc.text("Amount", 400, tableTop + tableRow * 20);
    tableRow++;

    // Add horizontal line
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();

    // Table rows
    let totalAmount = 0;
    sales.forEach((sale) => {
      totalAmount += sale.totalAmount;
      const customerName = sale.customer
        ? (sale.customer as any).name
        : sale.customerName || "Cash Sale";

      // Check if we need a new page
      if (tableTop + tableRow * 20 > 700) {
        doc.addPage();
        tableRow = 0;
        // Repeat headers on new page
        doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
        doc.text("Customer", 150, tableTop + tableRow * 20);
        doc.text("Payment", 300, tableTop + tableRow * 20);
        doc.text("Amount", 400, tableTop + tableRow * 20);
        tableRow++;

        // Add horizontal line
        doc
          .moveTo(50, tableTop + tableRow * 20 - 10)
          .lineTo(550, tableTop + tableRow * 20 - 10)
          .stroke();
      }

      // Write data
      doc
        .fontSize(10)
        .text(sale.date.toLocaleDateString(), 50, tableTop + tableRow * 20);
      doc.text(customerName.substring(0, 20), 150, tableTop + tableRow * 20);
      doc.text(sale.paymentMethod, 300, tableTop + tableRow * 20);
      doc.text(sale.totalAmount.toFixed(2), 400, tableTop + tableRow * 20);
      tableRow++;
    });

    // Add total
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();
    doc.fontSize(10).text("Total:", 300, tableTop + tableRow * 20);
    doc.text(totalAmount.toFixed(2), 400, tableTop + tableRow * 20);
  } else if (reportType === "items") {
    // Items report PDF
    fileName = `inventory_report_${new Date().toISOString().split("T")[0]}.pdf`;
    filePath = path.join(dir, fileName);

    // Pipe to file and response
    stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Get inventory data
    const items = await InventoryItem.find().sort({ name: 1 });

    // Add report title
    doc.fontSize(20).text("Inventory Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, {
      align: "center",
    });
    doc.moveDown(2);

    // Create table
    const tableTop = 150;
    let tableRow = 0;

    // Table headers
    doc.fontSize(10).text("Item Name", 50, tableTop + tableRow * 20);
    doc.text("Quantity", 250, tableTop + tableRow * 20);
    doc.text("Price", 350, tableTop + tableRow * 20);
    doc.text("Value", 450, tableTop + tableRow * 20);
    tableRow++;

    // Add horizontal line
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();

    // Table rows
    let totalValue = 0;
    items.forEach((item) => {
      const value = item.quantity * item.price;
      totalValue += value;

      // Check if we need a new page
      if (tableTop + tableRow * 20 > 700) {
        doc.addPage();
        tableRow = 0;
        // Repeat headers on new page
        doc.fontSize(10).text("Item Name", 50, tableTop + tableRow * 20);
        doc.text("Quantity", 250, tableTop + tableRow * 20);
        doc.text("Price", 350, tableTop + tableRow * 20);
        doc.text("Value", 450, tableTop + tableRow * 20);
        tableRow++;

        // Add horizontal line
        doc
          .moveTo(50, tableTop + tableRow * 20 - 10)
          .lineTo(550, tableTop + tableRow * 20 - 10)
          .stroke();
      }

      // Write data
      doc
        .fontSize(10)
        .text(item.name.substring(0, 30), 50, tableTop + tableRow * 20);
      doc.text(item.quantity.toString(), 250, tableTop + tableRow * 20);
      doc.text(item.price.toFixed(2), 350, tableTop + tableRow * 20);
      doc.text(value.toFixed(2), 450, tableTop + tableRow * 20);
      tableRow++;
    });

    // Add total
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();
    doc.fontSize(10).text("Total Value:", 350, tableTop + tableRow * 20);
    doc.text(totalValue.toFixed(2), 450, tableTop + tableRow * 20);
  } else if (reportType === "customer-ledger" && customerId) {
    // Customer ledger PDF
    const customer = await Customer.findById(customerId);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    fileName = `customer_ledger_${customer.name.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    filePath = path.join(dir, fileName);

    // Pipe to file and response
    stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Get all transactions for customer
    const transactions = await Sale.find({
      ...dateFilter,
      customer: new mongoose.Types.ObjectId(customerId),
    }).sort({ date: 1 });

    // Add report title
    doc.fontSize(20).text("Customer Ledger", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(customer.name, { align: "center" });
    doc.moveDown();

    // Add customer details
    doc.fontSize(12).text(`Address: ${customer.address}`);
    doc.text(`Mobile: ${customer.mobile}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    doc.text(
      `Period: ${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}`
    );
    doc.moveDown(2);

    // Create table
    const tableTop = 220;
    let tableRow = 0;

    // Table headers
    doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
    doc.text("Items", 150, tableTop + tableRow * 20);
    doc.text("Payment", 350, tableTop + tableRow * 20);
    doc.text("Amount", 450, tableTop + tableRow * 20);
    tableRow++;

    // Add horizontal line
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();

    // Table rows
    let totalAmount = 0;
    transactions.forEach((transaction) => {
      totalAmount += transaction.totalAmount;
      const itemsStr = transaction.items
        .map((item) => `${item.name.substring(0, 20)}`)
        .join(", ");

      // Check if we need a new page
      if (tableTop + tableRow * 20 > 700) {
        doc.addPage();
        tableRow = 0;
        // Repeat headers on new page
        doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
        doc.text("Items", 150, tableTop + tableRow * 20);
        doc.text("Payment", 350, tableTop + tableRow * 20);
        doc.text("Amount", 450, tableTop + tableRow * 20);
        tableRow++;

        // Add horizontal line
        doc
          .moveTo(50, tableTop + tableRow * 20 - 10)
          .lineTo(550, tableTop + tableRow * 20 - 10)
          .stroke();
      }

      // Write data
      doc
        .fontSize(10)
        .text(
          transaction.date.toLocaleDateString(),
          50,
          tableTop + tableRow * 20
        );
      doc.text(itemsStr.substring(0, 30), 150, tableTop + tableRow * 20);
      doc.text(transaction.paymentMethod, 350, tableTop + tableRow * 20);
      doc.text(
        transaction.totalAmount.toFixed(2),
        450,
        tableTop + tableRow * 20
      );
      tableRow++;
    });

    // Add total
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();
    doc.fontSize(10).text("Total:", 350, tableTop + tableRow * 20);
    doc.text(totalAmount.toFixed(2), 450, tableTop + tableRow * 20);
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid report type or missing customer ID for ledger",
    });
    return;
  }

  // Finalize PDF
  doc.end();

  // Check if filePath and stream are defined (they should be if we got here)
  if (!filePath || !stream) {
    res.status(500).json({
      success: false,
      message: "Error creating PDF file",
    });
    return;
  }

  // Wait for stream to finish
  stream.on("finish", () => {
    // Send file for download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).json({
          success: false,
          message: "Error downloading file",
          error: err.message,
        });
        return;
      }

      // Delete file after download
      fs.unlinkSync(filePath);
    });
  });
};

// Email report
export const emailReport = async (req: Request, res: Response) => {
  const { reportType } = req.params;
  const { email } = req.body;
  const dateFilter = getDateRangeFilter(req);
  const customerId = req.query.customerId as string;

  // Validate email
  if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
    res.status(400).json({
      success: false,
      message: "Valid email address is required",
    });
    return;
  }

  // Get email configuration from environment variables
  // const emailConfig = {
  //   host: process.env.EMAIL_HOST || "",
  //   port: parseInt(process.env.EMAIL_PORT || "587"),
  //   user: process.env.EMAIL_USER || "",
  //   pass: process.env.EMAIL_PASS || "",
  //   from: process.env.EMAIL_FROM || "noreply@example.com",
  // };

  // // Check if email configuration is set
  // if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
  //   res.status(500).json({
  //     success: false,
  //     message: "Email service is not configured",
  //   });
  //   return;
  // }

  // Create directory if it doesn't exist
  const dir = path.join(__dirname, "../exports");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let fileName = "";
  let filePath = "";
  let subject = "";
  let text = "";

  // Create PDF file based on report type
  if (reportType === "sales") {
    fileName = `sales_report_${new Date().toISOString().split("T")[0]}.pdf`;
    filePath = path.join(dir, fileName);
    subject = "Sales Report";
    text = `Please find attached the sales report for the period ${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}.`;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Get sales data
    const sales = await Sale.find(dateFilter)
      .sort({ date: 1 })
      .populate("customer", "name")
      .populate("createdBy", "username");

    // Add report title
    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Period: ${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}`,
        { align: "center" }
      );
    doc.moveDown(2);

    // Create table
    const tableTop = 150;
    let tableRow = 0;

    // Table headers
    doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
    doc.text("Customer", 150, tableTop + tableRow * 20);
    doc.text("Payment", 300, tableTop + tableRow * 20);
    doc.text("Amount", 400, tableTop + tableRow * 20);
    tableRow++;

    // Add horizontal line
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();

    // Table rows
    let totalAmount = 0;
    sales.forEach((sale) => {
      totalAmount += sale.totalAmount;
      const customerName = sale.customer
        ? (sale.customer as any).name
        : sale.customerName || "Cash Sale";

      // Check if we need a new page
      if (tableTop + tableRow * 20 > 700) {
        doc.addPage();
        tableRow = 0;
        // Repeat headers on new page
        doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
        doc.text("Customer", 150, tableTop + tableRow * 20);
        doc.text("Payment", 300, tableTop + tableRow * 20);
        doc.text("Amount", 400, tableTop + tableRow * 20);
        tableRow++;

        // Add horizontal line
        doc
          .moveTo(50, tableTop + tableRow * 20 - 10)
          .lineTo(550, tableTop + tableRow * 20 - 10)
          .stroke();
      }

      // Write data
      doc
        .fontSize(10)
        .text(sale.date.toLocaleDateString(), 50, tableTop + tableRow * 20);
      doc.text(customerName.substring(0, 20), 150, tableTop + tableRow * 20);
      doc.text(sale.paymentMethod, 300, tableTop + tableRow * 20);
      doc.text(sale.totalAmount.toFixed(2), 400, tableTop + tableRow * 20);
      tableRow++;
    });

    // Add total
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();
    doc.fontSize(10).text("Total:", 300, tableTop + tableRow * 20);
    doc.text(totalAmount.toFixed(2), 400, tableTop + tableRow * 20);

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  } else if (reportType === "items") {
    fileName = `inventory_report_${new Date().toISOString().split("T")[0]}.pdf`;
    filePath = path.join(dir, fileName);
    subject = "Inventory Report";
    text = `Please find attached the inventory report generated on ${new Date().toLocaleDateString()}.`;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Get inventory data
    const items = await InventoryItem.find().sort({ name: 1 });

    // Add report title
    doc.fontSize(20).text("Inventory Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, {
      align: "center",
    });
    doc.moveDown(2);

    // Create table
    const tableTop = 150;
    let tableRow = 0;

    // Table headers
    doc.fontSize(10).text("Item Name", 50, tableTop + tableRow * 20);
    doc.text("Quantity", 250, tableTop + tableRow * 20);
    doc.text("Price", 350, tableTop + tableRow * 20);
    doc.text("Value", 450, tableTop + tableRow * 20);
    tableRow++;

    // Add horizontal line
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();

    // Table rows
    let totalValue = 0;
    items.forEach((item) => {
      const value = item.quantity * item.price;
      totalValue += value;

      // Check if we need a new page
      if (tableTop + tableRow * 20 > 700) {
        doc.addPage();
        tableRow = 0;
        // Repeat headers on new page
        doc.fontSize(10).text("Item Name", 50, tableTop + tableRow * 20);
        doc.text("Quantity", 250, tableTop + tableRow * 20);
        doc.text("Price", 350, tableTop + tableRow * 20);
        doc.text("Value", 450, tableTop + tableRow * 20);
        tableRow++;

        // Add horizontal line
        doc
          .moveTo(50, tableTop + tableRow * 20 - 10)
          .lineTo(550, tableTop + tableRow * 20 - 10)
          .stroke();
      }

      // Write data
      doc
        .fontSize(10)
        .text(item.name.substring(0, 30), 50, tableTop + tableRow * 20);
      doc.text(item.quantity.toString(), 250, tableTop + tableRow * 20);
      doc.text(item.price.toFixed(2), 350, tableTop + tableRow * 20);
      doc.text(value.toFixed(2), 450, tableTop + tableRow * 20);
      tableRow++;
    });

    // Add total
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();
    doc.fontSize(10).text("Total Value:", 350, tableTop + tableRow * 20);
    doc.text(totalValue.toFixed(2), 450, tableTop + tableRow * 20);

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  } else if (reportType === "customer-ledger" && customerId) {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    fileName = `customer_ledger_${customer.name.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    filePath = path.join(dir, fileName);
    subject = `Customer Ledger: ${customer.name}`;
    text = `Please find attached the ledger for ${
      customer.name
    } for the period ${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}.`;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Get all transactions for customer
    const transactions = await Sale.find({
      ...dateFilter,
      customer: new mongoose.Types.ObjectId(customerId),
    }).sort({ date: 1 });

    // Add report title
    doc.fontSize(20).text("Customer Ledger", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(customer.name, { align: "center" });
    doc.moveDown();

    // Add customer details
    doc.fontSize(12).text(`Address: ${customer.address}`);
    doc.text(`Mobile: ${customer.mobile}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    doc.text(
      `Period: ${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}`
    );
    doc.moveDown(2);

    // Create table
    const tableTop = 220;
    let tableRow = 0;

    // Table headers
    doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
    doc.text("Items", 150, tableTop + tableRow * 20);
    doc.text("Payment", 350, tableTop + tableRow * 20);
    doc.text("Amount", 450, tableTop + tableRow * 20);
    tableRow++;

    // Add horizontal line
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();

    // Table rows
    let totalAmount = 0;
    transactions.forEach((transaction) => {
      totalAmount += transaction.totalAmount;
      const itemsStr = transaction.items
        .map((item) => `${item.name.substring(0, 20)}`)
        .join(", ");

      // Check if we need a new page
      if (tableTop + tableRow * 20 > 700) {
        doc.addPage();
        tableRow = 0;
        // Repeat headers on new page
        doc.fontSize(10).text("Date", 50, tableTop + tableRow * 20);
        doc.text("Items", 150, tableTop + tableRow * 20);
        doc.text("Payment", 350, tableTop + tableRow * 20);
        doc.text("Amount", 450, tableTop + tableRow * 20);
        tableRow++;

        // Add horizontal line
        doc
          .moveTo(50, tableTop + tableRow * 20 - 10)
          .lineTo(550, tableTop + tableRow * 20 - 10)
          .stroke();
      }

      // Write data
      doc
        .fontSize(10)
        .text(
          transaction.date.toLocaleDateString(),
          50,
          tableTop + tableRow * 20
        );
      doc.text(itemsStr.substring(0, 30), 150, tableTop + tableRow * 20);
      doc.text(transaction.paymentMethod, 350, tableTop + tableRow * 20);
      doc.text(
        transaction.totalAmount.toFixed(2),
        450,
        tableTop + tableRow * 20
      );
      tableRow++;
    });

    // Add total
    doc
      .moveTo(50, tableTop + tableRow * 20 - 10)
      .lineTo(550, tableTop + tableRow * 20 - 10)
      .stroke();
    doc.fontSize(10).text("Total:", 350, tableTop + tableRow * 20);
    doc.text(totalAmount.toFixed(2), 450, tableTop + tableRow * 20);

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid report type or missing customer ID for ledger",
    });
    return;
  }

  // Create email transporter
  // const transporter = nodemailer.createTransport({
  //   host: emailConfig.host,
  //   port: emailConfig.port,
  //   secure: emailConfig.port === 465, // true for 465, false for other ports
  //   auth: {
  //     user: emailConfig.user,
  //     pass: emailConfig.pass,
  //   },
  // });

  // // Send email with attachment
  // const info = await transporter.sendMail({
  //   from: emailConfig.from,
  //   to: email,
  //   subject: subject,
  //   text: text,
  //   attachments: [
  //     {
  //       filename: fileName,
  //       path: filePath,
  //     },
  //   ],
  // });

  const info = await sendEmail({
    to: email,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: fileName,
        content: Buffer.from(filePath),
      },
    ],
  });

  // Delete file after sending
  fs.unlinkSync(filePath);

  res.status(200).json({
    success: true,
    message: `Report sent to ${email} successfully`,
    messageId: info.messageId,
  });
  return;
};
