import { Router } from "express";
import {
  createPassword,
  editPassword,
  generatePassword,
  getPasswordImage,
  getPassword,
  decryptPassword,
  getSecurityQuestions,
  deletePasswordsBulk,
  exportPasswordsJson,
} from "../controllers/password-controllers";
import protect from "../middleware/protect";
import { validateRequest } from "../middleware/error-middleware";
import {
  createPasswordSchema,
  decryptPasswordSchema,
  exportPasswordsSchema,
  generatePasswordSchema,
} from "../validation/password-validation";
import { upload } from "../utils/file-storage"
import { IMAGE_UPLOAD_FIELD_NAME } from "../constants/security-policy";

const router = Router();

router.get("/", protect, getPassword);
router.post(
  "/decrypt-password",
  protect,
  validateRequest(decryptPasswordSchema),
  decryptPassword
);
router.post(
  "/",
  protect,
  upload.single(IMAGE_UPLOAD_FIELD_NAME),
  validateRequest(createPasswordSchema),
  createPassword
);
router.get("/:id/questions", protect, getSecurityQuestions);
router.get("/:id/image", protect, getPasswordImage);
router.patch(
  "/:id",
  protect,
  upload.single(IMAGE_UPLOAD_FIELD_NAME),
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
router.post(
  "/export/json",
  protect,
  validateRequest(exportPasswordsSchema),
  exportPasswordsJson
);

export default router;
