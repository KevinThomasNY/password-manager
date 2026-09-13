import { Request, Response, NextFunction } from "express";
import * as userModel from "../models/user-model";
import jwt from "jsonwebtoken";
import { successResponse } from "../utils/response";
import { UnauthorizedError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
import { ACCOUNT_POLICY, AccountStatus } from "../constants/account-policy";
import { unlockUserVault } from "../services/vault-service";
import {
  createVaultSession,
  destroyVaultSession,
  destroyVaultSessionsForUser,
} from "../services/vault-session-store";

export const editUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? "" : req.params.id;

    if (parseInt(id, 10) !== req.user?.id) {
      logger.error("Unauthorized access to update user");
      return next(new UnauthorizedError());
    }

    let updatedUser;
    let message: string;

    if ("currentPassword" in req.body) {
      updatedUser = await userModel.updateUserPassword(
        id,
        req.body.currentPassword,
        req.body.newPassword,
        req.user!.vaultKey
      );
      destroyVaultSessionsForUser(req.user!.id, req.user!.sessionId);
      message = "Password updated successfully";
      logger.info(`Password updated successfully for user ${id}`);
    } else {
      updatedUser = await userModel.updateUserProfile(
        id,
        req.body.userName,
        req.body.firstName,
        req.body.lastName
      );
      message = "Profile updated successfully";
      logger.info(`Profile updated successfully for user ${id}`);
    }

    return successResponse({
      res,
      message,
      data: updatedUser,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, password } = req.body;
    logger.debug(`loginUser: userName=${userName}`);
    const user = await userModel.fetchUserByEmail(userName);
    if (user.status !== AccountStatus.Active) {
      throw new UnauthorizedError("Invalid username or password");
    }
    await userModel.comparePassword(password, user.password);
    const vaultKey = await unlockUserVault(user, password);
    const ipAddress =
      (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip) ??
      "unknown";
    try {
      await userModel.insertLoginHistory(user.id, ipAddress);
    } catch (error) {
      vaultKey.fill(0);
      throw error;
    }

    let sessionId: string;
    try {
      sessionId = createVaultSession(user.id, vaultKey);
    } finally {
      vaultKey.fill(0);
    }
    let token: string;
    try {
      token = jwt.sign(
        { id: user.id, username: user.userName, sessionId },
        process.env.SECRET_KEY!,
        {
          expiresIn: ACCOUNT_POLICY.SESSION_DURATION_SECONDS,
        }
      );
    } catch (error) {
      destroyVaultSession(sessionId);
      throw error;
    }
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCOUNT_POLICY.SESSION_DURATION_SECONDS * 1000,
    });
    successResponse({
      res,
      message: "User logged in Successfully",
      data: {
        userName: user.userName,
        role: user.role,
      },
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY!);
      if (typeof decoded !== "string" && typeof decoded.sessionId === "string") {
        destroyVaultSession(decoded.sessionId);
      }
    } catch {
      // The cookie is cleared even when it is already invalid or expired.
    }
  }
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });
  successResponse({
    res,
    message: "User logged out Successfully",
    statusCode: StatusCodes.OK,
  });
};

export const checkAuth = async (req: Request, res: Response) => {
  successResponse({
    res,
    message: "User is authenticated",
    data: {
      userId: req.user!.id,
      userName: req.user!.username,
      role: req.user!.role,
      status: req.user!.status,
    },
    statusCode: StatusCodes.OK,
  });
};

export const getLoginHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user!;
    logger.debug(`getLastLogin: userId=${id}`);
    let limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1;
    if (limit >= 100) {
      limit = 100;
      logger.debug(`Limit exceeded, setting to 100`);
    }
    const lastLogin = await userModel.fetchLoginHistory(id, limit);
    logger.debug(
      `Login history fetched successfully: ${JSON.stringify(lastLogin)}`
    );
    successResponse({
      res,
      message: "Login History fetched Successfully",
      data: lastLogin,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfileInformation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user!;
    logger.debug(`getProfileInformation: userId=${id}`);
    const profileInformation = await userModel.fetchUserById(id);
    const { firstName, lastName, userName } = profileInformation;
    const filteredProfile = { firstName, lastName, userName };
    logger.debug(
      `Profile information fetched successfully: ${JSON.stringify(
        filteredProfile
      )}`
    );
    successResponse({
      res,
      message: "Profile information fetched Successfully",
      data: filteredProfile,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    next(error);
  }
};
