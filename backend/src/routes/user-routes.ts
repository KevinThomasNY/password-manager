import { Router } from "express";
import {
  checkAuth,
  createUser,
  editUser,
  getLoginHistory,
  getProfileInformation,
  loginUser,
  logoutUser,
} from "../controllers/user-controllers";
import { validateRequest } from "../middleware/error-middleware";
import protect from "../middleware/protect";
import {
  createUserSchema,
  editUserSchema,
  login,
} from "../validation/user-validation";

const router = Router();

router.post("/", protect, validateRequest(createUserSchema), createUser);
router.patch("/:id", protect, validateRequest(editUserSchema), editUser);
router.post("/login", validateRequest(login), loginUser);
router.post("/logout", logoutUser);
router.get("/auth/check", checkAuth);
router.get("/login-history", protect, getLoginHistory);
router.get("/profile-information", protect, getProfileInformation);

export default router;
