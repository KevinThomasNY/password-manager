import { Router } from "express";
import {
  completeInitialSetup,
  createInvitation,
  getInvitations,
  getManagedUsers,
  getSetupStatus,
  registerWithInvitation,
  revokeInvitation,
  updateManagedUser,
} from "../controllers/account-controllers";
import { validateRequest } from "../middleware/error-middleware";
import protect, { requireAdmin } from "../middleware/protect";
import {
  createInvitationSchema,
  initialSetupSchema,
  invitationRegistrationSchema,
  manageUserSchema,
} from "../validation/user-validation";
import { createRateLimiter } from "../middleware/rate-limit";
import { ACCOUNT_POLICY } from "../constants/account-policy";

const publicAccountRouter = Router();
const registrationRateLimiter = createRateLimiter({
  maximumAttempts: ACCOUNT_POLICY.REGISTRATION_ATTEMPT_LIMIT,
  windowMilliseconds: ACCOUNT_POLICY.AUTH_RATE_LIMIT_WINDOW_MS,
});
publicAccountRouter.get("/setup/status", getSetupStatus);
publicAccountRouter.post(
  "/setup",
  registrationRateLimiter,
  validateRequest(initialSetupSchema),
  completeInitialSetup
);
publicAccountRouter.post(
  "/registration",
  registrationRateLimiter,
  validateRequest(invitationRegistrationSchema),
  registerWithInvitation
);

const adminRouter = Router();
adminRouter.use(protect, requireAdmin);
adminRouter.get("/users", getManagedUsers);
adminRouter.patch(
  "/users/:id",
  validateRequest(manageUserSchema),
  updateManagedUser
);
adminRouter.get("/invitations", getInvitations);
adminRouter.post(
  "/invitations",
  validateRequest(createInvitationSchema),
  createInvitation
);
adminRouter.delete("/invitations/:id", revokeInvitation);

export { adminRouter, publicAccountRouter };
