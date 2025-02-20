import { Router } from "express";
import {
  createPassword,
  editPassword,
  generatePassword,
  getPassword,
  decryptPassword,
  getSecurityQuestions,
  deletePasswordsBulk,
} from "../controllers/password-controllers";
import protect from "../middleware/protect";
import { validateRequest } from "../middleware/error-middleware";
import {
  createPasswordSchema,
  decryptPasswordSchema,
  generatePasswordSchema,
} from "../validation/password-validation";
import { upload } from "../utils/file-storage"

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
  upload.single("image"),
  validateRequest(createPasswordSchema),
  createPassword
);
router.get("/:id/questions", protect, getSecurityQuestions);
router.patch(
  "/:id",
  protect,
  upload.single("image"),
  validateRequest(createPasswordSchema),
  editPassword
);
router.post(
  "/generate-password",
  protect,
  validateRequest(generatePasswordSchema),
  generatePassword
);
router.delete("/:id", protect, deletePasswordsBulk);
export default router;
