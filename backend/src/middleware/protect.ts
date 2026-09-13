import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "./error-middleware";
import * as userModel from "../models/user-model";
import { StatusCodes } from "../utils/status-codes";
import { AccountStatus, UserRole } from "../constants/account-policy";
import { ForbiddenError } from "./error-middleware";
import { getVaultSession } from "../services/vault-session-store";

const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next(
        new AppError("You are not logged in", StatusCodes.UNAUTHORIZED)
      );
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as JwtPayload;
    if (typeof decoded.id !== "number" || typeof decoded.sessionId !== "string") {
      throw new Error("Invalid token payload");
    }

    const vaultKey = getVaultSession(decoded.sessionId, decoded.id);
    if (!vaultKey) {
      return next(
        new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED)
      );
    }

    const user = await userModel.fetchUserById(decoded.id);

    if (user.status !== AccountStatus.Active) {
      return next(
        new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED)
      );
    }

    req.user = {
      id: user.id,
      username: user.userName,
      role: user.role,
      status: user.status,
      sessionId: decoded.sessionId,
      vaultKey,
    };
    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
};

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== UserRole.Admin) {
    next(new ForbiddenError("Administrator access is required"));
    return;
  }

  next();
};

export default protect;
