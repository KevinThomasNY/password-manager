import { NextFunction, Request, Response } from "express";
import { AppError } from "./error-middleware";
import { StatusCodes } from "../utils/status-codes";

interface RateLimitPolicy {
  maximumAttempts: number;
  windowMilliseconds: number;
}

interface RateLimitRecord {
  attempts: number;
  resetsAt: number;
}

export function createRateLimiter(policy: RateLimitPolicy) {
  const records = new Map<string, RateLimitRecord>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const existingRecord = records.get(key);
    const record =
      !existingRecord || existingRecord.resetsAt <= now
        ? { attempts: 0, resetsAt: now + policy.windowMilliseconds }
        : existingRecord;

    record.attempts += 1;
    records.set(key, record);

    if (record.attempts > policy.maximumAttempts) {
      next(
        new AppError(
          "Too many attempts. Try again later.",
          StatusCodes.TOO_MANY_REQUESTS
        )
      );
      return;
    }

    next();
  };
}
