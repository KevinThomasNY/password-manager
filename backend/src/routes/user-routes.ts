import { Router } from "express";
import { createUser, editUser } from "../controllers/user-controllers";
import { validateRequest } from "../middleware/error-middleware";
import { createUserSchema, editUserSchema } from "../validation/user-validation";

const router = Router();

router.post("/", validateRequest(createUserSchema), createUser);
router.patch("/:id", validateRequest(editUserSchema), editUser);
export default router;
