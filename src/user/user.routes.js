import { Router } from "express";
import {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    obtenerUsuariosPorRol,
    actualizarUsuario,
    actualizarContraseña,
    actualizarRol,
    desactivarUsuario,
    eliminarCuentaPropia
} from "./user.controller.js";

import {
    obtenerTodosUsuariosValidator,
    obtenerPerfilPropioValidator,
    obtenerUsuariosPorRolValidator,
    actualizarPerfilPropioValidator,
    actualizarContraseñaValidator,
    actualizarRolValidator,
    eliminarUsuarioValidator,
    eliminarCuentaValidator
} from "../middlewares/user-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Obtener todos los usuarios
router.get("/", obtenerTodosUsuariosValidator, obtenerUsuarios);

// Obtener usuarios por rol
router.get("/rol/:rol", obtenerUsuariosPorRolValidator, obtenerUsuariosPorRol);

// Obtener usuario por ID (su propio perfil o si es gerente/admin)
router.get("/:uid", obtenerPerfilPropioValidator, obtenerUsuarioPorId);

// Actualizar usuario (su propio perfil O si es ADMIN edita a cualquiera)
router.put(
    "/actualizarUsuario/:uid",
    actualizarPerfilPropioValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "USUARIOS", (req) => `Actualización de usuario: ${req.params.uid}`),
    actualizarUsuario
);

// Actualizar contraseña
router.patch("/:uid/contrasena", actualizarContraseñaValidator, actualizarUsuario);

// Actualizar rol
router.patch(
    "/:uid/rol",
    actualizarRolValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "USUARIOS", (req) => `Cambio de rol para usuario: ${req.params.uid}`),
    actualizarRol
);

// Desactivar usuario (lógico)
router.delete(
    "/:uid",
    eliminarUsuarioValidator,
    crearAuditoriaMiddleware("ELIMINAR", "USUARIOS", (req) => `Desactivación de usuario: ${req.params.uid}`),
    desactivarUsuario
);

// Eliminar cuenta propia (físico)
router.delete(
    "/:uid/cuenta",
    eliminarCuentaValidator,
    crearAuditoriaMiddleware("ELIMINAR", "USUARIOS", (req) => `Eliminación de cuenta: ${req.params.uid}`),
    eliminarCuentaPropia
);

export default router;