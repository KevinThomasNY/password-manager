import { Response } from "express";
import { StatusCodes } from "./status-codes";

enum SensitiveResponseHeader {
  CacheControl = "Cache-Control",
  ContentTypeOptions = "X-Content-Type-Options",
  Expires = "Expires",
  Pragma = "Pragma",
}

enum SensitiveResponseHeaderValue {
  CacheControl = "no-store, no-cache, must-revalidate, private",
  ContentTypeOptions = "nosniff",
  Expires = "0",
  Pragma = "no-cache",
}

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

export function setSensitiveResponseHeaders(res: Response): void {
  res.setHeader(
    SensitiveResponseHeader.CacheControl,
    SensitiveResponseHeaderValue.CacheControl
  );
  res.setHeader(
    SensitiveResponseHeader.Pragma,
    SensitiveResponseHeaderValue.Pragma
  );
  res.setHeader(
    SensitiveResponseHeader.ContentTypeOptions,
    SensitiveResponseHeaderValue.ContentTypeOptions
  );
  res.setHeader(
    SensitiveResponseHeader.Expires,
    SensitiveResponseHeaderValue.Expires
  );
}
