import { Response } from "express";
import { StatusCodes } from "./status-codes";

interface SuccessResponseOptions {
  res: Response;
  message?: string;
  data?: any;
  statusCode?: number;
}

export function successResponse({
  res,
  message = "Success",
  data = null,
  statusCode = StatusCodes.OK,
}: SuccessResponseOptions) {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
}
