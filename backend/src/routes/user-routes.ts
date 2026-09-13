import { Router } from "express";
import {
  checkAuth,
  editUser,
  getLoginHistory,
  getProfileInformation,
  loginUser,
  logoutUser,
} from "../controllers/user-controllers";
import { validateRequest } from "../middleware/error-middleware";
import protect from "../middleware/protect";
import { editUserSchema, login } from "../validation/user-validation";
import { createRateLimiter } from "../middleware/rate-limit";
import { ACCOUNT_POLICY } from "../constants/account-policy";

const router = Router();
const loginRateLimiter = createRateLimiter({
  maximumAttempts: ACCOUNT_POLICY.AUTH_ATTEMPT_LIMIT,
  windowMilliseconds: ACCOUNT_POLICY.AUTH_RATE_LIMIT_WINDOW_MS,
});

router.patch("/:id", protect, validateRequest(editUserSchema), editUser);
router.post("/login", loginRateLimiter, validateRequest(login), loginUser);
router.post("/logout", logoutUser);
router.get("/auth/check", protect, checkAuth);
router.get("/login-history", protect, getLoginHistory);
router.get("/profile-information", protect, getProfileInformation);

export default router;
