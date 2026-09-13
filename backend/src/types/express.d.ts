import { Request } from "express";
import { AccountStatus, UserRole } from "../constants/account-policy";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: UserRole;
        status: AccountStatus;
      };
    }
  }
}
