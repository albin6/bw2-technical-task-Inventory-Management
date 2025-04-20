// controllers/auth.controller.ts
import { Request, Response } from "express";
import User from "../models/user.model";
import { setCookies } from "../utils/set-cookie";
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { CustomJwtPayload, CustomRequest } from "../types/auth.type";
import { Messages } from "../constants/messages";
import { StatusCode } from "../constants/status-codes";
import { AppError } from "../utils/app-error";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    throw new AppError(Messages.auth.USER_EXISTS, StatusCode.CONFLICT);
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    role: role || "admin",
  });

  const payload: CustomJwtPayload = {
    id: user._id as string,
    email: user.email,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  setCookies(res, accessToken, refreshToken);

  res.status(StatusCode.CREATED).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(
      Messages.auth.INVALID_CREDENTIALS,
      StatusCode.UNAUTHORIZED
    );
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(
      Messages.auth.INVALID_CREDENTIALS,
      StatusCode.UNAUTHORIZED
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
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Refresh token
// @route   GET /api/auth/refresh-token
// @access  Private
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

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError(
          Messages.token.TOKEN_INVALID_REUSED,
          StatusCode.UNAUTHORIZED
        );
      }

      // Step 3: Issue new tokens
      const payload: CustomJwtPayload = {
        id: user._id as string,
        email: user.email,
      };

      const newAccessToken = createAccessToken(payload);

      const newRefreshToken = createRefreshToken(payload);

      user.refreshToken = newRefreshToken;

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

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response) => {
  const userId = (req as CustomRequest).user.id;

  const user = await User.findById(userId, { password: 0 });

  if (!user) {
    throw new AppError(Messages.auth.USER_NOT_FOUND, StatusCode.NOT_FOUND);
  }

  res.status(StatusCode.OK).json({
    success: true,
    user,
  });
};
