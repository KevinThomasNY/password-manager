import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
import multer from "multer";

enum UploadErrorCode {
  FileTooLarge = "LIMIT_FILE_SIZE",
}
class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this);
  }
}

// Specific error classes
class NotFoundError extends AppError {
  constructor(message: string = "Resource Not Found") {
    super(message, StatusCodes.NOT_FOUND);
  }
}

class ValidationError extends AppError {
  constructor(message: string = "Invalid Input") {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized Access") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, StatusCodes.FORBIDDEN);
  }
}

class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, StatusCodes.CONFLICT);
  }
}

// Zod validation function
export const validateRequest =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        next(new ValidationError(errorMessage));
      } else {
        next(error);
      }
    }
  };

// Error handling middleware
function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === UploadErrorCode.FileTooLarge
        ? "Image exceeds the maximum allowed size"
        : "Invalid image upload";
    logger.error(`Upload error: ${err.code}`);
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message,
    });
  } else if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, { statusCode: err.statusCode });
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  } else {
    logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}

export {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorMiddleware,
};
