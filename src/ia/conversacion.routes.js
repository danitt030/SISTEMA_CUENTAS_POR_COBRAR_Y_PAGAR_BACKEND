import { Router } from "express";
import {
  crearConversacion,
  obtenerConversaciones,
  obtenerConversacion,
  agregarMensajeConversacion,
  eliminarConversacion
} from "./conversacion.controller.js";
import { validateJWT } from "../middlewares/validate-jwt.js";

const router = Router();

// Proteger todas las rutas con validateJWT
router.use(validateJWT);

/**
 * POST / - Crear nueva conversación
 * Usado cuando se monta en /ia/conversacion
 */
router.post("/", crearConversacion);

/**
 * GET /:id - Obtener conversación completa por ID
 */
router.get("/:id", obtenerConversacion);

/**
 * POST /:id/mensaje - Agregar mensaje a conversación
 */
router.post("/:id/mensaje", agregarMensajeConversacion);

/**
 * DELETE /:id - Eliminar conversación
 */
router.delete("/:id", eliminarConversacion);

export default router;
