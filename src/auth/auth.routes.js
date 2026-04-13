import { Router } from "express";
import { registrar, iniciarSesion } from "./auth.controller.js";
import { registrarValidator, iniciarSesionValidator } from "../middlewares/user-validators.js";
import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";
import { validateJWTOptional } from "../middlewares/validate-jwt.js";

const router = Router();

// Registro PÚBLICO - Solo CLIENTE_ROLE (sin JWT)
// O crear otros roles si es ADMINISTRADOR con JWT + rol en body
router.post(
    "/register", 
    validateJWTOptional,  // Valida JWT si existe, pero no falla si no existe
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