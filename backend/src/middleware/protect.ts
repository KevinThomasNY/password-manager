import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "./error-middleware";
import * as userModel from "../models/user-model";
import { StatusCodes } from "../utils/status-codes";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next(
        new AppError("You are not logged in", StatusCodes.UNAUTHORIZED)
      );
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as JwtPayload;

    const user = await userModel.fetchUserById(decoded.id);

    req.user = {
      id: user.id,
      username: user.userName,
    };
    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
};

export default protect;
