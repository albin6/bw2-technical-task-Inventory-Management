import { CustomJwtPayload } from "../types/auth.type";
import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const createAccessToken = (payload: CustomJwtPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const createRefreshToken = (payload: CustomJwtPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): CustomJwtPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as CustomJwtPayload;
};

export const verifyRefreshToken = (token: string): CustomJwtPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as CustomJwtPayload;
};
