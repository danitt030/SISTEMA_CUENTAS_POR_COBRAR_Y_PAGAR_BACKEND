import { Router } from "express";
import { registrar, iniciarSesion } from "./auth.controller.js";
import { registrarValidator, iniciarSesionValidator } from "../middlewares/user-validators.js";
import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

router.post("/register", registrarValidator, registrar);

router.post(
    "/login",
    iniciarSesionValidator,
    crearAuditoriaMiddleware("LOGIN", "USUARIOS", (req) => `Login de usuario: ${req.body.usuario || req.body.correo}`),
    iniciarSesion
);

export default router;