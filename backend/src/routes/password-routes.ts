import { Router } from "express";
import { createPassword } from "../controllers/password-controllers";
import protect from "../middleware/protect";
import { validateRequest } from "../middleware/error-middleware";
import passwordSchema from "../validation/password-validation";

const router = Router();

router.post("/", protect, validateRequest(passwordSchema), createPassword);

export default router;
