import { Request, Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { Sale } from "../model/sale.model";

export const generateSalesReport = async (req: Request, res: Response) => {
  const { from, to, format, email } = req.query;

  const fromDate = from ? new Date(from as string) : new Date("2000-01-01");
  const toDate = to ? new Date(to as string) : new Date();

  // Validate dates
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    res.status(400).json({ error: "Invalid date format" });
    return;
  }

  const sales = await Sale.find({}).populate("items.item").populate("customer");

  // Ensure temp directory exists
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  if (format === "html") {
    // Simplified HTML response
    const html = `
        <html><body>
          <h2>Sales Report (${fromDate.toDateString()} - ${toDate.toDateString()})</h2>
          <ul>
            ${sales
              .map(
                (sale) => `
              <li>
                Date: ${sale.date.toDateString()} | 
                Customer: ${(sale.customer as any)?.name || "Guest"} | 
                Total: ₹${sale.totalAmount.toFixed(2)} | 
                Cash: ${sale.isCashSale ? "Yes" : "No"}
              </li>
            `
              )
              .join("")}
          </ul>
        </body></html>
      `;
    res.send(html);
    return;
  }

  if (format === "excel") {
    const filePath = path.join(tempDir, "sales_report.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Date", key: "date", width: 20 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Item", key: "item", width: 25 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Cash Sale", key: "cash", width: 10 },
    ];

    sales.forEach((sale) => {
      sale.items.forEach((saleItem) => {
        sheet.addRow({
          date: sale.date.toDateString(),
          customer: (sale.customer as any)?.name || "Guest",
          item: (saleItem.item as any).name,
          quantity: saleItem.quantity,
          price: saleItem.priceAtSale.toFixed(2),
          total: (saleItem.quantity * saleItem.priceAtSale).toFixed(2),
          cash: sale.isCashSale ? "Yes" : "No",
        });
      });
    });

    // Add a summary row
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    sheet.addRow({});
    sheet.addRow({
      customer: "TOTAL",
      total: totalAmount.toFixed(2),
    });

    // Save the workbook to a file
    await workbook.xlsx.writeFile(filePath);

    // Set response headers and send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    // Send the file and clean up after download
    res.download(filePath, "sales_report.xlsx", (err) => {
      if (err) {
        console.error("Excel download error:", err);
      }
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Excel file cleanup error:", unlinkErr);
      });
    });
    return;
  }

  if (format === "pdf") {
    const filePath = path.join(tempDir, "sales_report.pdf");
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc
      .fontSize(12)
      .text(
        `From: ${fromDate.toDateString()} To: ${toDate.toDateString()}\n\n`
      );

    let totalSalesAmount = 0;

    sales.forEach((sale, index) => {
      doc.text(`Sale ${index + 1}`);
      doc.text(`Date: ${sale.date.toDateString()}`);
      doc.text(`Customer: ${(sale.customer as any)?.name || "Guest"}`);
      doc.text(`Cash Sale: ${sale.isCashSale ? "Yes" : "No"}`);
      doc.text(`Total Amount: ₹${sale.totalAmount.toFixed(2)}`);

      totalSalesAmount += sale.totalAmount;

      doc.text("Items:");
      sale.items.forEach((item) => {
        doc.text(
          `  - ${(item.item as any).name} | Qty: ${
            item.quantity
          } | Price: ₹${item.priceAtSale.toFixed(2)} | Total: ₹${(
            item.quantity * item.priceAtSale
          ).toFixed(2)}`
        );
      });
      doc.text("\n");
    });

    doc.text(`Grand Total: ₹${totalSalesAmount.toFixed(2)}`, {
      underline: true,
    });

    doc.end();

    // Wait for the PDF to be fully written
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Send the file after it's fully written
    res.download(filePath, "sales_report.pdf", (err) => {
      if (err) {
        console.error("PDF download error:", err);
      }
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("PDF file cleanup error:", unlinkErr);
      });
    });
    return;
  }

  if (format === "email" && typeof email === "string") {
    // Generate Excel file for email attachment
    const filePath = path.join(tempDir, "sales_email.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Date", key: "date", width: 20 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Item", key: "item", width: 25 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Cash Sale", key: "cash", width: 10 },
    ];

    sales.forEach((sale) => {
      sale.items.forEach((saleItem) => {
        sheet.addRow({
          date: sale.date.toDateString(),
          customer: (sale.customer as any)?.name || "Guest",
          item: (saleItem.item as any).name,
          quantity: saleItem.quantity,
          price: saleItem.priceAtSale.toFixed(2),
          total: (saleItem.quantity * saleItem.priceAtSale).toFixed(2),
          cash: sale.isCashSale ? "Yes" : "No",
        });
      });
    });

    // Add summary row
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    console.log("sales data =>", sales);
    console.log("total amount =>", totalAmount);
    sheet.addRow({});
    sheet.addRow({
      customer: "TOTAL",
      total: totalAmount.toFixed(2),
    });

    // Save the file
    await workbook.xlsx.writeFile(filePath);

    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
      res.status(500).json({
        error:
          "Email configuration missing. Please check environment variables.",
      });
      return;
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Sales Report" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Sales Report",
      text: `Sales Report from ${fromDate.toDateString()} to ${toDate.toDateString()}`,
      html: `
            <h2>Sales Report</h2>
            <p>Please find the attached sales report for the period ${fromDate.toDateString()} to ${toDate.toDateString()}.</p>
            <p>Total Sales Amount: ₹${totalAmount.toFixed(2)}</p>
          `,
      attachments: [
        {
          filename: "sales_report.xlsx",
          path: filePath,
        },
      ],
    });

    // Clean up the file after sending
    fs.unlink(filePath, (err) => {
      if (err) console.error("Email attachment cleanup error:", err);
    });

    res.json({
      message: "Email sent successfully to " + email,
      period: `${fromDate.toDateString()} - ${toDate.toDateString()}`,
      salesCount: sales.length,
    });
    return;
  }

  res.status(400).json({ error: "Invalid format or parameters." });
};
