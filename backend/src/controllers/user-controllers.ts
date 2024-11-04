import { Request, Response, NextFunction } from "express";
import * as userModel from "../models/user-model";
import jwt from "jsonwebtoken";
import { successResponse } from "../utils/response";
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
    const { userName, password, firstName, lastName } = req.body;
    logger.debug(
      `editUser: userId=${req.params.id}, userName=${userName}, firstName=${firstName}, lastName=${lastName}`
    );
    const user = await userModel.updateUser(
      req.params.id,
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
