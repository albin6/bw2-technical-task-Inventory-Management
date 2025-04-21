import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { User } from "../model/user.model";
import { AppError } from "../utils/app-error";
import { Messages } from "../constants/messages";
import { StatusCode } from "../constants/status-codes";
import {
  createAccessToken,
  createRefreshToken,
  CustomJwtPayload,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { setCookies } from "../utils/set-cookie";

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    throw new AppError(Messages.auth.EMAIL_EXISTS, StatusCode.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    email,
    password: hashedPassword,
  });

  await newUser.save();

  const payload: CustomJwtPayload = {
    id: newUser._id as string,
    email: newUser.email,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);
  setCookies(res, accessToken, refreshToken);

  res.status(StatusCode.CREATED).json({
    success: true,
    user: payload,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(Messages.auth.USER_NOT_FOUND, StatusCode.NOT_FOUND);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new AppError(
      Messages.auth.INVALID_CREDENTIALS,
      StatusCode.BAD_REQUEST
    );
  }

  const payload: CustomJwtPayload = {
    id: user._id as string,
    email: user.email,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);
  setCookies(res, accessToken, refreshToken);

  res.status(StatusCode.OK).json({
    success: true,
    user: payload,
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw new AppError(Messages.token.TOKEN_MISSING, StatusCode.UNAUTHORIZED);
  }

  let shouldRefresh = false;

  try {
    verifyAccessToken(accessToken);
    res.status(StatusCode.OK).json({
      success: true,
      message: Messages.token.TOKEN_VALID,
    });
    return;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      shouldRefresh = true;
    } else {
      throw new AppError(Messages.token.TOKEN_INVALID, StatusCode.UNAUTHORIZED);
    }
  }

  if (shouldRefresh) {
    try {
      const decoded: any = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new AppError(
          Messages.token.TOKEN_INVALID_REUSED,
          StatusCode.UNAUTHORIZED
        );
      }

      // Step 3: Issue new tokens
      const payload = {
        id: user._id as string,
        email: user.email,
      };

      const newAccessToken = createAccessToken(payload);

      const newRefreshToken = createRefreshToken(payload);

      await user.save();

      // Set new cookies
      setCookies(res, newAccessToken, newRefreshToken);

      res.status(StatusCode.OK).json({
        success: true,
      });
    } catch (err) {
      throw new AppError(
        Messages.token.REFRESH_TOKEN_INVALID,
        StatusCode.UNAUTHORIZED
      );
    }
  }
};
