import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
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

// Zod validation function
export const validateRequest =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
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
  if (err instanceof AppError) {
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
  errorMiddleware,
};
