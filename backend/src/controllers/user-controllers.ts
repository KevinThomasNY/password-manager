import { Request, Response, NextFunction } from "express";
import * as userModel from "../models/user-model";
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
