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
    obtenerUsuarioPorIdValidator,
    obtenerUsuariosPorRolValidator,
    actualizarUsuarioValidator,
    actualizarContraseñaValidator,
    actualizarRolValidator,
    eliminarUsuarioValidator,
    eliminarCuentaValidator
} from "../middlewares/user-validators.js";

const router = Router();

// Obtener todos los usuarios
router.get("/", obtenerTodosUsuariosValidator, obtenerUsuarios);

// Obtener usuarios por rol
router.get("/rol/:rol", obtenerUsuariosPorRolValidator, obtenerUsuariosPorRol);

// Obtener usuario por ID
router.get("/:uid", obtenerUsuarioPorIdValidator, obtenerUsuarioPorId);

// Actualizar usuario
router.put("/actualizarUsuario/:uid", actualizarUsuarioValidator, actualizarUsuario);

// Actualizar contraseña
router.patch("/:uid/contrasena", actualizarContraseñaValidator, actualizarContraseña);

// Actualizar rol
router.patch("/:uid/rol", actualizarRolValidator, actualizarRol);

// Desactivar usuario (lógico)
router.delete("/:uid", eliminarUsuarioValidator, desactivarUsuario);

// Eliminar cuenta propia (físico)
router.delete("/:uid/cuenta", eliminarCuentaValidator, eliminarCuentaPropia);

export default router;