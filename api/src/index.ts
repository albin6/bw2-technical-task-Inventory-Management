import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";

import { errorHandler } from "./middlewares/error-handler.middleware";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.route";
import inventoryRoutes from "./routes/inventory.route";
import customerRoutes from "./routes/customer.route";
import salesRoutes from "./routes/sale.route";
import reportRoutes from "./routes/report.route";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportRoutes);

app.use("/", (req: Request, res: Response) => {
  res.json("Application is running!!!");
});

app.use(errorHandler);

connectDB();
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
