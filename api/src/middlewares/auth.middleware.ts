import { Messages } from "../constants/messages";
import { StatusCode } from "../constants/status-codes";
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { CustomRequest } from "../types/auth.type";

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      res
        .status(StatusCode.UNAUTHORIZED)
        .json({ message: Messages.token.TOKEN_MISSING });
      return;
    }

    const decoded = verifyAccessToken(token);

    (req as CustomRequest).user = decoded;
    next();
  } catch (error) {
    res
      .status(StatusCode.UNAUTHORIZED)
      .json({ message: Messages.token.TOKEN_EXPIRED });
  }
};
