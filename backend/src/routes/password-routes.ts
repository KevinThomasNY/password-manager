import { Router } from "express";
import {
  createPassword,
  editPassword,
  deletePassword,
  generatePassword,
  getPassword,
  decryptPassword,
} from "../controllers/password-controllers";
import protect from "../middleware/protect";
import { validateRequest } from "../middleware/error-middleware";
import {
  createPasswordSchema,
  decryptPasswordSchema,
  generatePasswordSchema,
} from "../validation/password-validation";

const router = Router();

router.get("/", protect, getPassword);

router.post(
  "/decrypt-password",
  validateRequest(decryptPasswordSchema),
  decryptPassword
);

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
