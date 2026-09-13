import { NextFunction, Request, Response } from "express";
import { ACCOUNT_POLICY } from "../constants/account-policy";
import * as accountModel from "../models/account-model";
import { parseRouteId } from "../utils/request";
import {
  setSensitiveResponseHeaders,
  successResponse,
} from "../utils/response";
import { StatusCodes } from "../utils/status-codes";

function registrationInput(req: Request): accountModel.NewAccountInput {
  const { userName, password, firstName, lastName } = req.body;
  return { userName, password, firstName, lastName };
}

export async function getSetupStatus(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    setSensitiveResponseHeaders(res);
    successResponse({
      res,
      data: { setupRequired: await accountModel.isSetupRequired() },
    });
  } catch (error) {
    next(error);
  }
}

export async function completeInitialSetup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = await accountModel.createInitialAdmin(registrationInput(req));
    successResponse({
      res,
      message: "Administrator account created",
      data: admin,
      statusCode: StatusCodes.CREATED,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerWithInvitation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await accountModel.consumeInvitation(
      req.body.invitationToken,
      registrationInput(req)
    );
    successResponse({
      res,
      message: "Account created",
      data: user,
      statusCode: StatusCodes.CREATED,
    });
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const invitation = await accountModel.createInvitation(
      req.user!.id,
      req.body.lifetimeHours ??
        ACCOUNT_POLICY.DEFAULT_INVITATION_LIFETIME_HOURS
    );
    setSensitiveResponseHeaders(res);
    successResponse({
      res,
      message: "Invitation created",
      data: invitation,
      statusCode: StatusCodes.CREATED,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvitations(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    successResponse({ res, data: await accountModel.listInvitations() });
  } catch (error) {
    next(error);
  }
}

export async function revokeInvitation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await accountModel.revokeInvitation(parseRouteId(req.params.id));
    successResponse({ res, message: "Invitation revoked" });
  } catch (error) {
    next(error);
  }
}

export async function getManagedUsers(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    successResponse({ res, data: await accountModel.listUsers() });
  } catch (error) {
    next(error);
  }
}

export async function updateManagedUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await accountModel.updateManagedUser(
      req.user!.id,
      parseRouteId(req.params.id),
      req.body
    );
    successResponse({ res, message: "User updated", data: user });
  } catch (error) {
    next(error);
  }
}
