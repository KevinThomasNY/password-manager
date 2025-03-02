import { Request, Response, NextFunction } from "express";
import * as userModel from "../models/user-model";
import jwt from "jsonwebtoken";
import { successResponse } from "../utils/response";
import { UnauthorizedError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, password, firstName, lastName } = req.body;
    logger.debug(
      `createUser: userName=${userName}, firstName=${firstName}, lastName=${lastName}`
    );
    const user = await userModel.addNewUser(
      userName,
      password,
      firstName,
      lastName
    );
    logger.info(`User created successfully: ${JSON.stringify(user)}`);
    successResponse({
      res,
      message: "User created Successfully",
      data: user,
      statusCode: StatusCodes.CREATED,
    });
  } catch (error) {
    next(error);
  }
};

export const editUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userName, password, firstName, lastName } = req.body;
    if (parseInt(id, 10) !== req.user?.id) {
      logger.error("Unauthorized access to edit user");
      return next(new UnauthorizedError());
    }
    logger.debug(
      `editUser: userId=${id}, userName=${userName}, firstName=${firstName}, lastName=${lastName}`
    );
    const user = await userModel.updateUser(
      id,
      userName,
      password,
      firstName,
      lastName
    );
    logger.info(`User updated successfully: ${JSON.stringify(user)}`);
    successResponse({
      res,
      message: "User updated Successfully",
      data: user,
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
    await userModel.comparePassword(password, user.password);
    const token = jwt.sign(
      { id: user.id, username: user.userName },
      process.env.SECRET_KEY!,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });
    const ipAddress =
      (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip) ??
      "unknown";

    await userModel.insertLoginHistory(user.id, ipAddress);
    successResponse({
      res,
      message: "User logged in Successfully",
      data: user.userName,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req: Request, res: Response) => {
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
  const token = req.cookies.token;

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: "error",
      message: "Unauthorized",
      data: null,
    });
  }

  successResponse({
    res,
    message: "User is authenticated",
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
