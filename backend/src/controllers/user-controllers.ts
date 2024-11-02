import { Request, Response, NextFunction } from "express";
import * as userModel from "../models/user-model";
import { successResponse } from "../utils/response";
import { StatusCodes } from "../utils/status-codes";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, password, firstName, lastName } = req.body;
    console.log("createUser:", userName, firstName, lastName);
    const user = await userModel.addNewUser(
      userName,
      password,
      firstName,
      lastName
    );
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
