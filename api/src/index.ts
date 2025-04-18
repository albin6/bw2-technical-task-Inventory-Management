import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";

import { errorHandler } from "./middlewares/error-handler.middleware";
import authRouter from "./routes/auth.route";
import salesRouter from "./routes/sale.route";
import customerRouter from "./routes/customer.route";
import inventoryRouter from "./routes/inventory.route";
import reportRouter from "./routes/report.route";
import { connectDB } from "./config/db";

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

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use("/api/auth", authRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/sales", salesRouter);
app.use("/api/customer", customerRouter);
app.use("/api/report", reportRouter);

app.use("/", (req: Request, res: Response) => {
  res.json("Application is running!!!");
});

app.use(errorHandler);

connectDB();
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
