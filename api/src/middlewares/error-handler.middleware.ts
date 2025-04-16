import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  console.log(err);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
