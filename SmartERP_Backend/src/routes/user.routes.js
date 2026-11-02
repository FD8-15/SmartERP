import { Router } from "express";
import { register, login, logout } from "../controllers/user.controller.js";
import { auth } from "../middlewares/jwt.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerUserSchema, loginUserSchema } from "../schemas/user.schema.js";

const router = Router();
router.route("/register").post(validate(registerUserSchema), register);
router.route("/login").post(validate(loginUserSchema), login);
router.route("/logout").post(auth, logout);

export default router;
