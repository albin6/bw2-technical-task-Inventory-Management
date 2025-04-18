import { Router } from "express";
import { login, register, getMe } from "../controllers/auth.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyAuth, getMe);

export default router;
