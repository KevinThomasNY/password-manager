import { Router } from "express";
import {
  createPassword,
  editPassword,
  deletePassword,
  generatePassword,
} from "../controllers/password-controllers";
import protect from "../middleware/protect";
import { validateRequest } from "../middleware/error-middleware";
import {
  createPasswordSchema,
  generatePasswordSchema,
} from "../validation/password-validation";

const router = Router();

router.post(
  "/",
  protect,
  validateRequest(createPasswordSchema),
  createPassword
);
router.patch(
  "/:id",
  protect,
  validateRequest(createPasswordSchema),
  editPassword
);
router.post(
  "/generate-password",
  protect,
  validateRequest(generatePasswordSchema),
  generatePassword
);
router.delete("/:id", protect, deletePassword);
export default router;
