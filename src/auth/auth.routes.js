import { Router } from "express";
import { registrar, iniciarSesion } from "./auth.controller.js";
import { registrarValidator, iniciarSesionValidator } from "../middlewares/user-validators.js";

const router = Router();

router.post("/register", registrarValidator, registrar);
router.post("/login", iniciarSesionValidator, iniciarSesion);

export default router;