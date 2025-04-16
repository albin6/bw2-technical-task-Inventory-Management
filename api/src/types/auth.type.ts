import { Request } from "express";
import { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload extends DefaultJwtPayload {
  id: string;
  email: string;
}

export interface CustomRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}
