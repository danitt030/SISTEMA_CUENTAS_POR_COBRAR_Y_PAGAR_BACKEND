import { Router } from "express";
import { registrar, iniciarSesion } from "./auth.controller.js";
import { registrarValidator, iniciarSesionValidator } from "../middlewares/user-validators.js";
import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";
import { validateJWT } from "../middlewares/validate-jwt.js";
import { hasRoles } from "../middlewares/validate-roles.js";

const router = Router();

// Registro administrativo - solo ADMINISTRADOR puede crear usuarios
router.post(
    "/register", 
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    registrarValidator, 
    crearAuditoriaMiddleware("CREAR", "USUARIOS", (req) => `Creación de usuario: ${req.body.usuario}`), 
    registrar
);

router.post(
    "/login",
    iniciarSesionValidator,
    crearAuditoriaMiddleware("LOGIN", "USUARIOS", (req) => `Login de usuario: ${req.body.usuario || req.body.correo}`),
    iniciarSesion
);

export default router;