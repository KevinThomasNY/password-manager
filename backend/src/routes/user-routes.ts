import { Router } from "express";
import { createUser } from "../controllers/user-controllers";
import { validateRequest } from "../middleware/error-middleware";
import { createUserSchema } from "../validation/user-validation";

const router = Router();

router.post("/", validateRequest(createUserSchema), createUser);

export default router;
