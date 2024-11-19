import { Router } from "express";
import { createPassword, editPassword, deletePassword } from "../controllers/password-controllers";
import protect from "../middleware/protect";
import { validateRequest } from "../middleware/error-middleware";
import passwordSchema from "../validation/password-validation";

const router = Router();

router.post("/", protect, validateRequest(passwordSchema), createPassword);
router.patch("/:id", protect, validateRequest(passwordSchema), editPassword);
router.delete("/:id", protect, deletePassword);
export default router;
